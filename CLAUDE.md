# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sajudating API is a Korean fortune-telling and dating service platform. It uses AI (OpenAI) to generate saju (사주) readings and ideal partner compatibility analyses based on birth date/time calculations.

**Architecture**: Monorepo with Go backend API and React TypeScript admin web interface.

- `api/`: Go 1.25+ backend using chi router, gqlgen GraphQL, MongoDB, OpenAI integration
- `admweb/`: React 19 + TypeScript + Vite admin UI with Apollo Client GraphQL
- `docs/`: Project documentation

## Key Development Commands

### Backend (api/)

All commands should be run from the `api/` directory:

```bash
cd api
make run              # Start dev server (go run server.go) on port 8080
make gqlgen           # Regenerate GraphQL types/resolvers from gqlgen.yml
go test ./...         # Run all Go tests
make build            # Build Docker image with auto-versioned tag
make buildpush        # Build, push to ECR, output container_image terraform variable
```

**Running tests**: Place `*_test.go` files alongside the code under test. Use table-driven tests when appropriate.

### Frontend (admweb/)

All commands should be run from the `admweb/` directory:

```bash
cd admweb
npm ci                # Install exact dependencies from package-lock.json
npm run dev           # Start Vite dev server
npm run build         # Type-check (tsc -b) then build to dist/
npm run lint          # Run ESLint
npm run gqlgen        # Generate typed Apollo hooks from codegen.yml
npm run gqlgenw       # Same as gqlgen but in watch mode
```

## Architecture Patterns

### API Architecture

**Dual API Pattern**: The backend serves two distinct APIs:
- **REST API** (`/api/saju_profile`): For user-facing mobile/web clients
- **GraphQL API** (`/api/admgql`): For admin management interface only

**Layer Structure**:
```
server.go → routes/ → service/ → dao/ → MongoDB
                  ↘ ext_dao/ → External APIs (OpenAI, Python tools)
```

- `server.go`: Application entry point, initializes database, sets up chi router with both REST and GraphQL endpoints
- `routes/`: REST endpoint definitions (user APIs only)
- `service/`: Business logic layer. Prefix `Admin*Service` for GraphQL resolvers, plain names for REST
- `dao/`: MongoDB data access layer. All collections use unique `uid` field instead of MongoDB `_id`
- `ext_dao/`: External API integrations (OpenAI, Python sxtwl Chinese calendar service)
- `admgql/`: GraphQL schema (`admgql.graphql`), resolvers (`admgql.resolvers.go`), and generated code
- `middleware/`: CORS, logging
- `dto/`: Request/response data transfer objects for REST endpoints
- `types/`: Shared type definitions

**GraphQL Code Generation**: Schema in `api/admgql/admgql.graphql` → run `make gqlgen` → generates:
- `api/admgql/admgql_generated/`: Generated executable schema (DO NOT EDIT)
- `api/admgql/model/models_gen.go`: Generated models
- `api/admgql/*.resolvers.go`: Resolver implementations (edit these)

**Custom Types**: `BigInt` type maps to `config.BigInt` (defined in `gqlgen.yml`) for handling large integers in GraphQL.

### Database Layer

**MongoDB Collections**:
- `ai_metas`: AI prompt templates and configurations
- `ai_executions`: Records of AI API calls and responses
- `saju_profiles`: User saju (fortune) profile data
- `phy_ideal_partners`: Physical/ideal partner compatibility data with vector embeddings

**Index Strategy**:
- All collections have unique `uid` index (not `_id`)
- `phy_ideal_partners` has Atlas Vector Search index (`embedding_vector_index`) on `embedding` field (1536 dimensions, cosine similarity) for semantic similarity search

**UID Pattern**: The codebase uses custom `uid` strings (e.g., UUID, base58-encoded IDs) as primary identifiers instead of MongoDB's `_id`. All repositories enforce uniqueness via unique index.

### Python Integration

The backend invokes `python_tool/sxtwl_service.py` for Chinese lunar calendar calculations (sxtwl library). Python is included in the Docker image for runtime availability. Go code shells out to Python scripts when needed for calendar conversions.

### Frontend Architecture

**State Management**: Jotai atoms for global state (`src/state/`)

**GraphQL Integration**:
- GraphQL documents in `admweb/src/graphql/*.graphql`
- Run `npm run gqlgen` to generate typed hooks in `admweb/src/graphql/generated.ts` (DO NOT EDIT)
- Apollo Client configured in `admweb/src/main.tsx`
- Uses schema from `../api/admgql/admgql.graphql` (codegen.yml points to backend schema)

**Component Structure**:
- `src/pages/`: Page-level components (routing)
- `src/components/`: Reusable UI components
- `src/api/`: REST API client utilities (for non-GraphQL endpoints)

**Theme**: Material-UI (MUI) with custom theme in `main.tsx`. Primary: `#0ea5e9`, Secondary: `#f97316`

## Environment Configuration

Backend requires these environment variables in `api/.env`:

```
SERVER_PORT=8080
MONGODB_URI=mongodb://localhost:27017
DB_NAME=sajudating
OPENAI_API_KEY=sk-...
ADMIN_USERNAME=dsadmin
ADMIN_PASSWORD=signal!23
SECRET_KEY=your-secret-key-here
```

Update `api/.env.example` if adding new environment variables.

## Docker & Deployment

**Multi-stage Build**:
1. `golang:alpine` builder: Compiles Go binary for linux/arm64
2. `python:3.11-alpine` runtime: Installs sxtwl, copies Go binary and Python tools

**AWS Deployment**: Makefile includes targets for ECR push and auto-versioning (format: `YYMMDD_NN`). The `buildpush` target outputs terraform-compatible container_image variable.

Frontend deploys to S3 + CloudFront: `npm run deploy_dev` (requires AWS profile `af_dev`)

## Code Style

**Go**:
- Standard `gofmt` formatting (tabs)
- Exported identifiers: `PascalCase`
- Packages: `lowercase`
- Avoid editing generated files (`admgql_generated/`)

**TypeScript/React**:
- ESLint configured
- Components: `PascalCase.tsx`
- Hooks: `useSomething`
- Avoid editing `src/graphql/generated.ts`

## Testing Strategy

Go tests use table-driven pattern. See `api/service/SajuProfileService_post.test.go` and `api/ext_dao/OpenAi*ExtDao.test.go` for examples.

No frontend test runner is currently configured.

## Important Conventions

1. **GraphQL for Admin, REST for Users**: Never mix these patterns. Admin operations use GraphQL resolvers; user-facing operations use REST handlers.

2. **Code Generation Workflow**:
   - Backend: Edit `admgql/*.graphql` → `make gqlgen` → implement resolvers
   - Frontend: Edit `src/graphql/*.graphql` → `npm run gqlgen` → use generated hooks

3. **UID vs _id**: Always use `uid` field for entity identity. Do not rely on MongoDB `_id`.

4. **External AI Calls**: All OpenAI interactions go through `ext_dao/OpenAi*ExtDao`. Log executions to `ai_executions` collection for audit trail.

5. **Vector Search**: `phy_ideal_partners` collection supports vector similarity search via Atlas Vector Search. Ensure Atlas cluster is configured if modifying vector search features.
