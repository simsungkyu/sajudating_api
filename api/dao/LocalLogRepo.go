// LocalLog repository for MongoDB operations on local_logs collection
package dao

import (
	"context"
	"time"

	"sajudating_api/api/dao/entity"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type LocalLogRepository struct {
	collection *mongo.Collection
}

func NewLocalLogRepository() *LocalLogRepository {
	return &LocalLogRepository{
		collection: GetDB().Collection("local_logs"),
	}
}

func (r *LocalLogRepository) Create(log *entity.LocalLog) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	now := time.Now().UnixMilli()
	log.CreatedAt = now
	if log.ExpiresAt == 0 {
		// ExpiresAt이 설정되지 않은 경우 기본값으로 하루 후로 설정
		log.ExpiresAt = now + (1 * 24 * 60 * 60 * 1000)
	}

	_, err := r.collection.InsertOne(ctx, log)
	return err
}

func (r *LocalLogRepository) FindByUID(uid string) (*entity.LocalLog, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var log entity.LocalLog
	err := r.collection.FindOne(ctx, bson.M{"uid": uid}).Decode(&log)
	if err != nil {
		return nil, err
	}

	return &log, nil
}

func (r *LocalLogRepository) FindAll() ([]entity.LocalLog, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := r.collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var logs []entity.LocalLog
	if err = cursor.All(ctx, &logs); err != nil {
		return nil, err
	}

	return logs, nil
}

func (r *LocalLogRepository) FindWithPagination(limit, offset int, status *string, orderBy, orderDirection *string) ([]entity.LocalLog, int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{}
	if status != nil && *status != "" {
		filter["status"] = *status
	}

	total, err := r.collection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	sortField := "created_at"
	if orderBy != nil && *orderBy != "" {
		switch *orderBy {
		case "createdAt", "created_at":
			sortField = "created_at"
		case "expiresAt", "expires_at":
			sortField = "expires_at"
		case "status":
			sortField = "status"
		}
	}

	sortDir := int32(-1) // desc by default
	if orderDirection != nil && *orderDirection != "" {
		switch *orderDirection {
		case "asc", "1":
			sortDir = 1
		case "desc", "-1":
			sortDir = -1
		}
	}

	findOptions := options.Find().
		SetSkip(int64(offset)).
		SetLimit(int64(limit)).
		SetSort(bson.D{{Key: sortField, Value: sortDir}})

	cursor, err := r.collection.Find(ctx, filter, findOptions)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var logs []entity.LocalLog
	if err = cursor.All(ctx, &logs); err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}

func (r *LocalLogRepository) FindByStatus(status string) ([]entity.LocalLog, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := r.collection.Find(ctx, bson.M{"status": status})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var logs []entity.LocalLog
	if err = cursor.All(ctx, &logs); err != nil {
		return nil, err
	}

	return logs, nil
}

func (r *LocalLogRepository) Update(log *entity.LocalLog) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{"uid": log.Uid}
	update := bson.M{"$set": log}

	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}

func (r *LocalLogRepository) UpdateStatus(uid string, status string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{"uid": uid}
	update := bson.M{"$set": bson.M{"status": status}}

	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}

func (r *LocalLogRepository) UpdateText(uid string, text string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{"uid": uid}
	update := bson.M{"$set": bson.M{"text": text}}

	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}

func (r *LocalLogRepository) Delete(uid string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.DeleteOne(ctx, bson.M{"uid": uid})
	return err
}

func (r *LocalLogRepository) DeleteExpired() (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	now := time.Now().UnixMilli()
	filter := bson.M{"expires_at": bson.M{"$lt": now}}

	result, err := r.collection.DeleteMany(ctx, filter)
	if err != nil {
		return 0, err
	}

	return result.DeletedCount, nil
}

func (r *LocalLogRepository) DeleteByStatus(status string) (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{"status": status}

	result, err := r.collection.DeleteMany(ctx, filter)
	if err != nil {
		return 0, err
	}

	return result.DeletedCount, nil
}
