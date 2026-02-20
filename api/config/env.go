// Package config loads app config from .env and exposes AppConfig plus helpers (e.g. IsDev).
package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	OpenAI   OpenAIConfig
	S3       S3Config
}

type ServerConfig struct {
	Env      string // dev, staging, prod
	Port     string
	LocalMCP bool
}

type DatabaseConfig struct {
	URI    string
	DBName string
}

type OpenAIConfig struct {
	APIKey string
}

type S3Config struct {
	Bucket    string
	AccessKey string
	SecretKey string
	Region    string
}

var AppConfig *Config

func LoadConfig() error {
	if err := godotenv.Load(); err != nil {
		fmt.Println("Warning: .env file not found, using environment variables")
	}

	AppConfig = &Config{
		Server: ServerConfig{
			Env:      getEnv("ENV", "dev"),
			Port:     getEnv("SERVER_PORT", "8080"),
			LocalMCP: getEnvBool("LOCAL_MCP", false),
		},
		Database: DatabaseConfig{
			URI:    getEnv("MONGODB_URI", "mongodb://localhost:27017"),
			DBName: getEnv("DB_NAME", "sajudating"),
		},
		OpenAI: OpenAIConfig{
			APIKey: getEnv("OPENAI_API_KEY", ""),
		},
		S3: S3Config{
			Bucket:    getEnv("AWS_IMAGE_S3_BUCKET", ""),
			AccessKey: getEnv("AWS_IMAGE_KEY", ""),
			SecretKey: getEnv("AWS_IMAGE_SECRET", ""),
			Region:    getEnv("AWS_REGION", "ap-northeast-2"),
		},
	}

	return nil
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func getEnvBool(key string, defaultValue bool) bool {
	v := os.Getenv(key)
	if v == "" {
		return defaultValue
	}
	return v == "1" || v == "true" || v == "yes"
}

// IsDev returns true when ENV is dev (default).
func IsDev() bool {
	if AppConfig == nil {
		return true
	}
	return AppConfig.Server.Env == "dev"
}
