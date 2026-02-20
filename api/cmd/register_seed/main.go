// One-off CLI: read seed JSON from file, register via mcplocal.RegisterCardJSON, print ok/uid or msg.
package main

import (
	"context"
	"encoding/json"
	"log"
	"os"

	"sajudating_api/api/config"
	"sajudating_api/api/dao"
	"sajudating_api/api/mcplocal"
)

func main() {
	if len(os.Args) < 2 {
		log.Fatal("usage: register_seed <path-to-seed.json>")
	}
	if err := config.LoadConfig(); err != nil {
		log.Fatalf("config: %v", err)
	}
	if err := dao.InitDatabase(); err != nil {
		log.Fatalf("database: %v", err)
	}
	defer dao.CloseDatabase()

	path := os.Args[1]
	data, err := os.ReadFile(path)
	if err != nil {
		log.Fatalf("read file: %v", err)
	}

	ok, uid, msg := mcplocal.RegisterCardJSON(context.Background(), string(data))
	out := struct {
		Ok  bool   `json:"ok"`
		UID string `json:"uid,omitempty"`
		Msg string `json:"msg,omitempty"`
	}{Ok: ok, UID: uid, Msg: msg}
	enc := json.NewEncoder(os.Stdout)
	enc.SetEscapeHTML(false)
	if err := enc.Encode(out); err != nil {
		log.Fatalf("encode: %v", err)
	}
	if !ok {
		os.Exit(1)
	}
}
