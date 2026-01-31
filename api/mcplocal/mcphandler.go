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

// NewServer creates an MCP server with default implementation info and registers the sample "hello" tool.
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
