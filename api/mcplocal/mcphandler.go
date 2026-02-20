// mcplocal provides a streamable HTTP MCP server for local development only.
package mcplocal

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

const (
	// ServerName is the MCP server implementation name exposed to clients.
	ServerName = "y2sl-local"
	// ServerVersion is the MCP server version.
	ServerVersion = "0.1.0"
)

// helloArgs is the input schema for the hello tool.
type helloArgs struct {
	Name string `json:"name"`
}

// NewServer creates an MCP server with default implementation info and registers hello + card register/update tools.
func NewServer() *mcp.Server {
	s := mcp.NewServer(&mcp.Implementation{
		Name:    ServerName,
		Version: ServerVersion,
	}, nil)
	mcp.AddTool(s, &mcp.Tool{
		Name:        "hello",
		Description: "Say hello. Optional name to greet (default: world).",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args helloArgs) (*mcp.CallToolResult, any, error) {
		name := args.Name
		if name == "" {
			name = "world"
		}
		return &mcp.CallToolResult{
			Content: []mcp.Content{&mcp.TextContent{Text: "Hello, " + name + "!"}},
		}, nil, nil
	})
	mcp.AddTool(s, &mcp.Tool{
		Name:        "register_card",
		Description: "Register a single data card (saju or pair). Accepts card_json: JSON string conforming to CardDataStructure (saju) or ChemiStructure (pair, src P|A|B). Required: card_id, scope, trigger, title. Returns ok and uid or error msg.",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args registerCardArgs) (*mcp.CallToolResult, any, error) {
		ok, uid, msg := runRegisterCard(ctx, args.CardJSON)
		text := formatToolResult(ok, uid, msg)
		return &mcp.CallToolResult{
			Content: []mcp.Content{&mcp.TextContent{Text: text}},
		}, nil, nil
	})
	mcp.AddTool(s, &mcp.Tool{
		Name:        "update_card",
		Description: "Update an existing data card by uid. Accepts uid and card_json (partial or full card JSON per CardDataStructure/ChemiStructure). Returns ok or error msg.",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args updateCardArgs) (*mcp.CallToolResult, any, error) {
		ok, msg := runUpdateCard(ctx, args.UID, args.CardJSON)
		text := formatToolResult(ok, "", msg)
		return &mcp.CallToolResult{
			Content: []mcp.Content{&mcp.TextContent{Text: text}},
		}, nil, nil
	})
	mcp.AddTool(s, &mcp.Tool{
		Name:        "list_cards",
		Description: "Query existing cards. Optional filters: scope (saju|pair), status, category, card_id (substring), limit (default 50, max 200). Returns list of card summaries: card_id, uid, scope, title, status.",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args listCardsArgs) (*mcp.CallToolResult, any, error) {
		summaries, msg := runListCards(ctx, args.Scope, args.Status, args.Category, args.CardID, args.Limit)
		if msg != "" {
			return &mcp.CallToolResult{
				Content: []mcp.Content{&mcp.TextContent{Text: formatToolResult(false, "", msg)}},
			}, nil, nil
		}
		out, _ := json.Marshal(map[string]any{"ok": true, "cards": summaries})
		return &mcp.CallToolResult{
			Content: []mcp.Content{&mcp.TextContent{Text: string(out)}},
		}, nil, nil
	})
	return s
}

// Handler returns an http.Handler that serves the MCP protocol over streamable HTTP (single /mcp endpoint, JSON + SSE).
// Pass the *mcp.Server returned by NewServer(); register tools/prompts/resources on that server before calling Handler.
// Any GET that is not for SSE (Accept: text/event-stream) returns a JSON-RPC 2.0 error so clients parse it correctly.
func Handler(server *mcp.Server) http.Handler {
	mcpHandler := mcp.NewStreamableHTTPHandler(func(_ *http.Request) *mcp.Server {
		return server
	}, nil)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			accept := r.Header.Get("Accept")
			if !strings.Contains(accept, "text/event-stream") {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusMethodNotAllowed)
				_ = json.NewEncoder(w).Encode(map[string]any{
					"jsonrpc": "2.0",
					"id":      0,
					"error": map[string]any{
						"code":    -32600,
						"message": "Use POST for JSON-RPC or GET with Accept: text/event-stream for SSE",
					},
				})
				return
			}
		}
		mcpHandler.ServeHTTP(w, r)
	})
}
