// SajuProfileLog repository for MongoDB operations on saju_profile_logs collection
package dao

import (
	"context"
	"time"

	"sajudating_api/api/dao/entity"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type SajuProfileLogRepository struct {
	collection *mongo.Collection
}

func NewSajuProfileLogRepository() *SajuProfileLogRepository {
	return &SajuProfileLogRepository{
		collection: GetDB().Collection("saju_profile_logs"),
	}
}

func (r *SajuProfileLogRepository) Create(log *entity.SajuProfileLog) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	log.CreatedAt = time.Now().UnixMilli()

	_, err := r.collection.InsertOne(ctx, log)
	return err
}

func (r *SajuProfileLogRepository) FindAll() ([]entity.SajuProfileLog, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := r.collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var logs []entity.SajuProfileLog
	if err = cursor.All(ctx, &logs); err != nil {
		return nil, err
	}

	return logs, nil
}

func (r *SajuProfileLogRepository) FindByUID(uid string) (*entity.SajuProfileLog, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var log entity.SajuProfileLog
	err := r.collection.FindOne(ctx, bson.M{"uid": uid}).Decode(&log)
	if err != nil {
		return nil, err
	}

	return &log, nil
}

func (r *SajuProfileLogRepository) FindBySajuUID(sajuUID string) ([]entity.SajuProfileLog, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := r.collection.Find(ctx, bson.M{"saju_uid": sajuUID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var logs []entity.SajuProfileLog
	if err = cursor.All(ctx, &logs); err != nil {
		return nil, err
	}

	return logs, nil
}

func (r *SajuProfileLogRepository) FindWithPagination(limit, offset int, sajuUID string, status *string) ([]entity.SajuProfileLog, int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{
		"saju_uid": sajuUID,
	}
	if status != nil && *status != "" {
		filter["status"] = *status
	}

	total, err := r.collection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	opts := options.Find()
	opts.SetLimit(int64(limit))
	opts.SetSkip(int64(offset))
	opts.SetSort(bson.D{{Key: "created_at", Value: 1}})

	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var logs []entity.SajuProfileLog
	if err = cursor.All(ctx, &logs); err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}

func (r *SajuProfileLogRepository) Delete(uid string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.DeleteOne(ctx, bson.M{"uid": uid})
	return err
}
