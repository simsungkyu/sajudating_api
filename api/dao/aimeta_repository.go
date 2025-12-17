package dao

import (
	"context"
	"time"

	"sajudating_api/api/dao/entity"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type AIMetaRepository struct {
	collection *mongo.Collection
}

func NewAIMetaRepository() *AIMetaRepository {
	return &AIMetaRepository{
		collection: GetDB().Collection("ai_metas"),
	}
}

func (r *AIMetaRepository) Create(meta *entity.AIMeta) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	now := time.Now().UnixMilli()
	meta.CreatedAt = now
	meta.UpdatedAt = now

	_, err := r.collection.InsertOne(ctx, meta)
	return err
}

func (r *AIMetaRepository) FindAll() ([]entity.AIMeta, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := r.collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var metas []entity.AIMeta
	if err = cursor.All(ctx, &metas); err != nil {
		return nil, err
	}

	return metas, nil
}

func (r *AIMetaRepository) FindByUID(uid string) (*entity.AIMeta, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var meta entity.AIMeta
	err := r.collection.FindOne(ctx, bson.M{"uid": uid}).Decode(&meta)
	if err != nil {
		return nil, err
	}

	return &meta, nil
}

func (r *AIMetaRepository) FindByMetaType(metaType string) ([]entity.AIMeta, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := r.collection.Find(ctx, bson.M{"meta_type": metaType})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var metas []entity.AIMeta
	if err = cursor.All(ctx, &metas); err != nil {
		return nil, err
	}

	return metas, nil
}

func (r *AIMetaRepository) Update(meta *entity.AIMeta) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	meta.UpdatedAt = time.Now().UnixMilli()
	filter := bson.M{"uid": meta.Uid}
	update := bson.M{"$set": meta}

	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}

func (r *AIMetaRepository) Delete(uid string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.DeleteOne(ctx, bson.M{"uid": uid})
	return err
}

func (r *AIMetaRepository) FindWithPagination(limit, offset int, metaType *string) ([]entity.AIMeta, int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Build filter
	filter := bson.M{}
	if metaType != nil && *metaType != "" {
		filter["meta_type"] = *metaType
	}

	// Get total count
	total, err := r.collection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	// Find with pagination using options
	opts := options.Find()
	opts.SetLimit(int64(limit))
	opts.SetSkip(int64(offset))

	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var metas []entity.AIMeta
	if err = cursor.All(ctx, &metas); err != nil {
		return nil, 0, err
	}

	return metas, total, nil
}
