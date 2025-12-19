package dao

import (
	"context"
	"time"

	"sajudating_api/api/dao/entity"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type AiExecutionRepository struct {
	collection *mongo.Collection
}

func NewAiExecutionRepository() *AiExecutionRepository {
	return &AiExecutionRepository{
		collection: GetDB().Collection("ai_executions"),
	}
}

func (r *AiExecutionRepository) Create(execution *entity.AiExecution) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	now := time.Now().UnixMilli()
	execution.CreatedAt = now
	execution.UpdatedAt = now

	_, err := r.collection.InsertOne(ctx, execution)
	return err
}

func (r *AiExecutionRepository) FindAll() ([]entity.AiExecution, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := r.collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var executions []entity.AiExecution
	if err = cursor.All(ctx, &executions); err != nil {
		return nil, err
	}

	return executions, nil
}

func (r *AiExecutionRepository) FindByUID(uid string) (*entity.AiExecution, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var execution entity.AiExecution
	err := r.collection.FindOne(ctx, bson.M{"uid": uid}).Decode(&execution)
	if err != nil {
		return nil, err
	}

	return &execution, nil
}

func (r *AiExecutionRepository) FindByMetaUID(metaUID string) ([]entity.AiExecution, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := r.collection.Find(ctx, bson.M{"meta_uid": metaUID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var executions []entity.AiExecution
	if err = cursor.All(ctx, &executions); err != nil {
		return nil, err
	}

	return executions, nil
}

func (r *AiExecutionRepository) FindByMetaType(metaType string) ([]entity.AiExecution, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := r.collection.Find(ctx, bson.M{"meta_type": metaType})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var executions []entity.AiExecution
	if err = cursor.All(ctx, &executions); err != nil {
		return nil, err
	}

	return executions, nil
}

func (r *AiExecutionRepository) Update(execution *entity.AiExecution) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	execution.UpdatedAt = time.Now().UnixMilli()

	filter := bson.M{"uid": execution.Uid}
	update := bson.M{"$set": execution}

	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}

func (r *AiExecutionRepository) Delete(uid string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.DeleteOne(ctx, bson.M{"uid": uid})
	return err
}

func (r *AiExecutionRepository) FindWithPagination(limit, offset int, metaUID, metaType *string, runBy, runSajuProfileUid *string) ([]entity.AiExecution, int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{}
	if metaUID != nil && *metaUID != "" {
		filter["meta_uid"] = *metaUID
	}
	if metaType != nil && *metaType != "" {
		filter["meta_type"] = *metaType
	}
	if runBy != nil && *runBy != "" {
		filter["run_by"] = *runBy
	}
	if runSajuProfileUid != nil && *runSajuProfileUid != "" {
		filter["run_saju_profile_uid"] = *runSajuProfileUid
	}

	total, err := r.collection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	opts := options.Find()
	opts.SetLimit(int64(limit))
	opts.SetSkip(int64(offset))
	opts.SetSort(bson.D{{Key: "created_at", Value: -1}})

	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var executions []entity.AiExecution
	if err = cursor.All(ctx, &executions); err != nil {
		return nil, 0, err
	}

	return executions, total, nil
}
