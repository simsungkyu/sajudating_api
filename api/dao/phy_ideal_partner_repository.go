package dao

import (
	"context"
	"log"
	"time"

	"sajudating_api/api/dao/entity"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type PhyIdealPartnerRepository struct {
	collection *mongo.Collection
}

func NewPhyIdealPartnerRepository() *PhyIdealPartnerRepository {
	return &PhyIdealPartnerRepository{
		collection: GetDB().Collection("phy_ideal_partners"),
	}
}

func (r *PhyIdealPartnerRepository) Create(partner *entity.PhyIdealPartner) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	now := time.Now().UnixMilli()
	partner.CreatedAt = now
	partner.UpdatedAt = now

	_, err := r.collection.InsertOne(ctx, partner)
	return err
}

func (r *PhyIdealPartnerRepository) FindWithPagination(limit, offset int, sex *string) ([]entity.PhyIdealPartner, int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{}
	if sex != nil && *sex != "" {
		filter["sex"] = *sex
	}
	total, err := r.collection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	findOptions := options.Find().
		SetSkip(int64(offset)).
		SetLimit(int64(limit)).
		SetSort(bson.D{{Key: "created_at", Value: int32(-1)}})

	cursor, err := r.collection.Find(ctx, filter, findOptions)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var partners []entity.PhyIdealPartner
	if err = cursor.All(ctx, &partners); err != nil {
		return nil, 0, err
	}

	return partners, total, nil
}

func (r *PhyIdealPartnerRepository) FindAll() ([]entity.PhyIdealPartner, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := r.collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var partners []entity.PhyIdealPartner
	if err = cursor.All(ctx, &partners); err != nil {
		return nil, err
	}

	return partners, nil
}

func (r *PhyIdealPartnerRepository) FindByUID(uid string) (*entity.PhyIdealPartner, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var partner entity.PhyIdealPartner
	err := r.collection.FindOne(ctx, bson.M{"uid": uid}).Decode(&partner)
	if err != nil {
		return nil, err
	}

	return &partner, nil
}

func (r *PhyIdealPartnerRepository) FindBySexAndAge(sex string, age int) ([]entity.PhyIdealPartner, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{
		"sex": sex,
		"age": age,
	}

	cursor, err := r.collection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var partners []entity.PhyIdealPartner
	if err = cursor.All(ctx, &partners); err != nil {
		return nil, err
	}

	return partners, nil
}

func (r *PhyIdealPartnerRepository) Update(partner *entity.PhyIdealPartner) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	partner.UpdatedAt = time.Now().UnixMilli()

	filter := bson.M{"uid": partner.Uid}
	update := bson.M{"$set": partner}

	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}

func (r *PhyIdealPartnerRepository) UpdateImageMimeType(uid string, imageMimeType string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{"uid": uid}
	update := bson.M{"$set": bson.M{
		"image_mime_type": imageMimeType,
		"has_image":       true,
		"updated_at":      time.Now().UnixMilli(),
	}}
	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}

func (r *PhyIdealPartnerRepository) Delete(uid string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.DeleteOne(ctx, bson.M{"uid": uid})
	return err
}

// FindMostSimilarByEmbedding performs vector search using MongoDB Atlas Vector Search
// to find the most similar partner based on embedding vector.
// If indexName is empty, it uses the default index name "embedding_vector_index"
func (r *PhyIdealPartnerRepository) FindMostSimilarByEmbedding(queryVector []float64, indexName string, sex string, minSimilarityScore float64) (*entity.PhyIdealPartner, float64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Use default index name if not provided
	if indexName == "" {
		indexName = "embedding_vector_index"
	}

	// MongoDB Atlas Vector Search aggregation pipeline
	pipeline := mongo.Pipeline{
		bson.D{{
			Key: "$vectorSearch",
			Value: bson.D{
				{Key: "index", Value: indexName},
				{Key: "path", Value: "embedding"},
				{Key: "queryVector", Value: queryVector},
				{Key: "numCandidates", Value: 100},
				{Key: "limit", Value: 1},
				{Key: "filter", Value: bson.D{{Key: "sex", Value: sex}}},
			},
		}},
		bson.D{{
			Key: "$addFields",
			Value: bson.D{
				{Key: "similarity_score", Value: bson.D{
					{Key: "$meta", Value: "vectorSearchScore"},
				}},
			},
		}},
		bson.D{{
			Key: "$match",
			Value: bson.D{
				{"similarity_score", bson.D{{"$gte", minSimilarityScore}}},
			},
		}},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var partners []entity.PhyIdealPartner
	if err = cursor.All(ctx, &partners); err != nil {
		return nil, 0, err
	}

	if len(partners) == 0 {
		return nil, 0, mongo.ErrNoDocuments
	}

	return &partners[0], partners[0].SimilarityScore, nil
}

func (r *PhyIdealPartnerRepository) FindSimilarByEmbeddingWithPagination(
	queryVector []float64, indexName string, limit int, offset int,
	sex string,
) ([]entity.PhyIdealPartner, int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if indexName == "" {
		indexName = "embedding_vector_index"
	}

	pipeline := mongo.Pipeline{
		bson.D{{
			Key: "$vectorSearch",
			Value: bson.D{
				{Key: "index", Value: indexName},
				{Key: "path", Value: "embedding"},
				{Key: "queryVector", Value: queryVector},
				{Key: "numCandidates", Value: 100},
				{Key: "limit", Value: limit},
				// {Key: "offset", Value: offset},
				{Key: "filter", Value: bson.D{{Key: "sex", Value: sex}}},
			},
		}},
		bson.D{{
			Key: "$addFields",
			Value: bson.D{
				{Key: "similarity_score", Value: bson.D{
					{Key: "$meta", Value: "vectorSearchScore"},
				}},
			},
		}},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		log.Printf("Failed to aggregate phy ideal partners: %v", err)
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var partners []entity.PhyIdealPartner
	if err = cursor.All(ctx, &partners); err != nil {
		return nil, 0, err
	}

	return partners, int64(cursor.RemainingBatchLength()), nil
}
