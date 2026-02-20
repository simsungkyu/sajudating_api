# Repository Guidelines

**기본 참조**: 이 문서와 함께 [`.cursor/rules/`](.cursor/rules/)의 룰을 기본으로 참조한다.

## Project Structure

- `api/`: Go backend (GraphQL via `gqlgen`) plus `python_tool/` helper scripts used by the container image.
  - Key folders: `api/config/` (env/config), `api/middleware/`, `api/dao/`, `api/service/`, `api/dto/`, `api/admgql/` (schema + resolvers).
- `admweb/`: Admin web UI (React + TypeScript + Vite). Main code in `admweb/src/` with GraphQL documents in `admweb/src/graphql/`.
- `api/client.ts`: Apollo Client configuration. use Apollo Provider in `main.tsx`.
- `docs/`: Project documentation and notes.

## Build, Test, and Development Commands

Backend (`api/`):

- `cd api && make run`: runs the API locally (`go run server.go`) on `SERVER_PORT` (default `8080`).
- `cd api && make gqlgen`: regenerates GraphQL types/resolvers from `api/gqlgen.yml`.
- `cd api && go test ./...`: runs Go tests (add `*_test.go` files alongside the code under test). From repo root: `cd api && go test ./...` or `(cd api && go test ./...)`.
- **SajuAssemble (itemNcard) verification** (from repo root): run `cd api && make test-itemncard` to run itemncard + service tests, MCP card tools tests (./mcplocal/...), and full build (see api/Makefile). Before release, if you changed SajuAssemble/itemNcard code, run: `cd api && make test-itemncard`. MCP card tools are covered by go test ./mcplocal/... (no MongoDB required).

Frontend (`admweb/`):

- `cd admweb && npm ci`: installs exact dependencies from `package-lock.json`.
- `cd admweb && npm run dev`: starts Vite dev server.
- `cd admweb && npm run build`: type-checks (`tsc -b`) then builds to `admweb/dist/`.
- `cd admweb && npm run lint`: runs ESLint.
- `cd admweb && npm run gqlgen`: generates typed Apollo hooks to `admweb/src/graphql/generated.ts` from `admweb/codegen.yml`.

## Coding Style & Naming Conventions

- Go: use `gofmt` (tabs/standard formatting); exported identifiers `PascalCase`, packages `lowercase`.
- Use rest api for user service.
- Use graphql for admin service.
- Web: TypeScript/React uses ESLint; components `PascalCase.tsx`, hooks `useSomething`.
- Avoid editing generated code under `api/admgql/admgql_generated/` and `admweb/src/graphql/generated.ts`; edit schemas/documents and re-run codegen.

## Testing Guidelines

- Prefer small, table-driven Go tests (`*_test.go`) with `go test ./...`.
- No frontend test runner is configured in `admweb/` yet; add one intentionally (and document it) if you introduce UI tests.

## Commit & Pull Request Guidelines

- This repo currently has no Git history; use Conventional Commits (e.g., `feat(api): add pagination`).
- PRs should include: purpose/impact, how to test locally (exact commands), and any config/env changes (update `.env.example` if needed).

## Security & Configuration

- Backend config comes from `api/.env` / environment variables: `SERVER_PORT`, `MONGODB_URI`, `DB_NAME`, `OPENAI_API_KEY`.
- Do not commit secrets/keys (e.g., `*.pem`, real `.env` values). Prefer sanitized examples in `.env.example`.
