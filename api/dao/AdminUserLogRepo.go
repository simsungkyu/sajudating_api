// AdminUserLog repository for MongoDB operations on admin_user_logs collection
package dao

import (
	"context"
	"time"

	"sajudating_api/api/dao/entity"

	"go.mongodb.org/mongo-driver/mongo"
)

type AdminUserLogRepo struct {
	collection *mongo.Collection
}

func NewAdminUserLogRepo() *AdminUserLogRepo {
	return &AdminUserLogRepo{
		collection: database.Collection("admin_user_logs"),
	}
}

func (r *AdminUserLogRepo) Create(log *entity.AdminUserLog) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	log.CreatedAt = time.Now().UnixMilli()

	_, err := r.collection.InsertOne(ctx, log)
	return err
}
