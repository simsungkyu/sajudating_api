FROM golang:alpine AS builder

WORKDIR /app
COPY . .

ENV GO111MODULE=on

RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -a -ldflags="-s -w" -o bin/main server.go



FROM python:3.11-alpine

WORKDIR /app

# Install Python dependencies
# sxtwl requires C++ compiler to build, so install build tools temporarily
# libstdc++ is needed at runtime for sxtwl
RUN apk add --no-cache libstdc++ && \
    apk add --no-cache --virtual .build-deps \
    build-base \
    python3-dev && \
    pip install --no-cache-dir sxtwl && \
    apk del .build-deps

# Copy Go binary from builder
COPY --from=builder /app/bin/main ./main

# Copy Python tools
COPY python_tool /app/python_tool

# Make Python script executable
RUN chmod +x /app/python_tool/sxtwl_service.py

EXPOSE 8080
ENTRYPOINT [ "./main" ]