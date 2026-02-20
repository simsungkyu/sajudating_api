// AdminUser repository for MongoDB operations on admin_users collection
package dao

import (
	"context"
	"time"

	"sajudating_api/api/dao/entity"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type AdminUserRepo struct {
	collection *mongo.Collection
}

func NewAdminUserRepo() *AdminUserRepo {
	return &AdminUserRepo{
		collection: database.Collection("admin_users"),
	}
}

func (r *AdminUserRepo) Create(user *entity.AdminUser) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	now := time.Now().UnixMilli()
	user.CreatedAt = now
	user.UpdatedAt = now

	_, err := r.collection.InsertOne(ctx, user)
	return err
}

func (r *AdminUserRepo) FindByEmail(email string) (*entity.AdminUser, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var user entity.AdminUser
	err := r.collection.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *AdminUserRepo) FindByUID(uid string) (*entity.AdminUser, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var user entity.AdminUser
	err := r.collection.FindOne(ctx, bson.M{"uid": uid}).Decode(&user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

// FindAll returns all admin users, sorted by created_at ascending.
func (r *AdminUserRepo) FindAll() ([]*entity.AdminUser, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: 1}})
	cursor, err := r.collection.Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var list []entity.AdminUser
	if err := cursor.All(ctx, &list); err != nil {
		return nil, err
	}
	users := make([]*entity.AdminUser, len(list))
	for i := range list {
		users[i] = &list[i]
	}
	return users, nil
}

func (r *AdminUserRepo) Update(user *entity.AdminUser) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	user.UpdatedAt = time.Now().UnixMilli()
	filter := bson.M{"uid": user.Uid}
	update := bson.M{"$set": user}

	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}

func (r *AdminUserRepo) UpdateSessionKey(uid string, sessionKey string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{"uid": uid}
	update := bson.M{
		"$set": bson.M{
			"session_key":   sessionKey,
			"last_login_at": time.Now().UnixMilli(),
			"updated_at":    time.Now().UnixMilli(),
		},
	}

	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}

func (r *AdminUserRepo) UpdateActive(uid string, active bool) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{"uid": uid}
	update := bson.M{
		"$set": bson.M{
			"is_active":  active,
			"updated_at": time.Now().UnixMilli(),
		},
	}

	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}
