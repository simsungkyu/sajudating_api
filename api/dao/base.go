package dao

import (
	"context"
	"fmt"
	"log"
	"time"

	"sajudating_api/api/config"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	client   *mongo.Client
	database *mongo.Database
)

func InitDatabase() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOptions := options.Client().ApplyURI(config.AppConfig.Database.URI)

	var err error
	client, err = mongo.Connect(ctx, clientOptions)
	if err != nil {
		return fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	if err = client.Ping(ctx, nil); err != nil {
		return fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	database = client.Database(config.AppConfig.Database.DBName)

	// Verify database access by listing collections
	log.Printf("Verifying access to database: %s", config.AppConfig.Database.DBName)
	_, err = database.ListCollectionNames(ctx, map[string]any{})
	if err != nil {
		return fmt.Errorf("failed to access database '%s': %w", config.AppConfig.Database.DBName, err)
	}

	log.Printf("MongoDB connected successfully to database: %s", config.AppConfig.Database.DBName)

	// Create indexes
	if err := createIndexes(); err != nil {
		log.Printf("Warning: Failed to create indexes: %v", err)
		// Don't return error, just log warning
	}

	return nil
}

func CloseDatabase() {
	if client != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := client.Disconnect(ctx); err != nil {
			log.Printf("Error disconnecting from MongoDB: %v", err)
		} else {
			log.Println("MongoDB connection closed")
		}
	}
}

func GetDB() *mongo.Database {
	return database
}

func GetClient() *mongo.Client {
	return client
}

// createIndexes creates necessary indexes for all collections
func createIndexes() error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Collection names that need uid unique index
	collectionNames := []string{
		"ai_metas",
		"ai_executions",
		"saju_profiles",
		"phy_ideal_partners",
		"saju_profile_logs",
	}

	// Create unique index on uid field for all collections
	for _, collName := range collectionNames {
		if err := createUniqueUidIndex(ctx, collName); err != nil {
			log.Printf("Warning: Failed to create uid index for %s: %v", collName, err)
		} else {
			log.Printf("Successfully ensured uid unique index for collection: %s", collName)
		}
	}

	// Create vector search index for phy_ideal_partners
	if err := createVectorSearchIndex(ctx); err != nil {
		log.Printf("Warning: Failed to create vector search index: %v", err)
	} else {
		log.Printf("Successfully ensured vector search index for phy_ideal_partners")
	}

	return nil
}

// createUniqueUidIndex creates a unique index on the uid field
func createUniqueUidIndex(ctx context.Context, collectionName string) error {
	collection := database.Collection(collectionName)

	indexModel := mongo.IndexModel{
		Keys:    bson.D{{Key: "uid", Value: 1}},
		Options: options.Index().SetUnique(true).SetName("uid_unique"),
	}

	_, err := collection.Indexes().CreateOne(ctx, indexModel)
	if err != nil {
		// Check if error is because index already exists
		if mongo.IsDuplicateKeyError(err) || isIndexExistsError(err) {
			return nil // Index already exists, not an error
		}
		return fmt.Errorf("failed to create uid index: %w", err)
	}

	return nil
}

const VectorSearchIndexName = "embedding_vector_index"

// createVectorSearchIndex creates an Atlas Vector Search index for embedding field
func createVectorSearchIndex(ctx context.Context) error {
	collection := database.Collection("phy_ideal_partners")

	// Vector Search index definition
	// Note: Adjust dimensions based on your embedding model
	// - OpenAI text-embedding-ada-002: 1536 dimensions
	// - OpenAI text-embedding-3-small: 1536 dimensions
	// - OpenAI text-embedding-3-large: 3072 dimensions
	indexDefinition := bson.D{
		{Key: "fields", Value: bson.A{
			bson.D{
				{Key: "type", Value: "vector"},
				{Key: "path", Value: "embedding"},
				{Key: "numDimensions", Value: 1536}, // Adjust based on your model
				{Key: "similarity", Value: "cosine"},
			},
			bson.D{
				{Key: "type", Value: "filter"},
				{Key: "path", Value: "sex"},
			},
			bson.D{
				{Key: "type", Value: "filter"},
				{Key: "path", Value: "has_image"},
			},
		}},
	}

	searchIndexModel := mongo.SearchIndexModel{
		Definition: indexDefinition,
		Options:    options.SearchIndexes().SetName("embedding_vector_index").SetType("vectorSearch"),
	}

	// Note: This requires MongoDB Atlas with Atlas Search enabled
	// The SearchIndexes() API is only available for Atlas clusters
	_, err := collection.SearchIndexes().CreateOne(ctx, searchIndexModel)
	if err != nil {
		// Check if error is because index already exists
		if isIndexExistsError(err) {
			return nil // Index already exists, not an error
		}
		log.Printf("failed to create vector search index (requires Atlas): %v", err.Error())
		return fmt.Errorf("failed to create vector search index (requires Atlas): %w", err)
	}

	return nil
}

// isIndexExistsError checks if the error indicates that the index already exists
func isIndexExistsError(err error) bool {
	if err == nil {
		return false
	}
	// MongoDB returns different error messages for existing indexes
	errMsg := err.Error()
	return contains(errMsg, "already exists") ||
		contains(errMsg, "IndexOptionsConflict") ||
		contains(errMsg, "duplicate")
}

// contains checks if a string contains a substring (case-insensitive helper)
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) && findSubstring(s, substr))
}

func findSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
