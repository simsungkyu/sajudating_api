// Package dao: ItemNCard repository for itemn_cards collection (list/get/create/update/delete).
package dao

import (
	"context"
	"time"

	"sajudating_api/api/dao/entity"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type ItemNCardRepository struct {
	collection *mongo.Collection
}

func NewItemNCardRepository() *ItemNCardRepository {
	return &ItemNCardRepository{
		collection: GetDB().Collection("itemn_cards"),
	}
}

// ItemNCardListFilter filters for list (scope, status, category, tags, rule_set, domain, cooldown_group, include_deleted).
type ItemNCardListFilter struct {
	Scope          *string
	Status         *string
	Category       *string
	Tags           []string // any of these tags (elem match or in)
	RuleSet        *string
	Domain         *string // if set, filter cards whose domains array contains this (substring or exact)
	CooldownGroup  *string // if set, filter by cooldown_group (substring match)
	IncludeDeleted bool
	Limit          int
	Offset         int
	OrderBy        string // e.g. "priority", "created_at"
	OrderDir       string // "asc" | "desc"
}

func (r *ItemNCardRepository) Create(card *entity.ItemNCard) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	now := time.Now().UnixMilli()
	card.CreatedAt = now
	card.UpdatedAt = now
	card.DeletedAt = 0

	_, err := r.collection.InsertOne(ctx, card)
	return err
}

func (r *ItemNCardRepository) FindByUID(uid string) (*entity.ItemNCard, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var card entity.ItemNCard
	err := r.collection.FindOne(ctx, bson.M{"uid": uid}).Decode(&card)
	if err != nil {
		return nil, err
	}
	return &card, nil
}

func (r *ItemNCardRepository) FindByCardID(cardID string) (*entity.ItemNCard, error) {
	return r.FindByCardIDAndScope(cardID, "")
}

// FindByCardIDAndScope finds by card_id; if scope is non-empty, also filters by scope.
func (r *ItemNCardRepository) FindByCardIDAndScope(cardID, scope string) (*entity.ItemNCard, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{"card_id": cardID}
	if scope != "" {
		filter["scope"] = scope
	}
	var card entity.ItemNCard
	err := r.collection.FindOne(ctx, filter).Decode(&card)
	if err != nil {
		return nil, err
	}
	return &card, nil
}

// FindByCardIDsAndScope returns cards whose card_id is in cardIDs and scope matches (for LLM context preview).
func (r *ItemNCardRepository) FindByCardIDsAndScope(cardIDs []string, scope string) ([]entity.ItemNCard, error) {
	if len(cardIDs) == 0 {
		return nil, nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{"card_id": bson.M{"$in": cardIDs}}
	if scope != "" {
		filter["scope"] = scope
	}
	// LLM context: only non-deleted cards
	filter["$or"] = []bson.M{{"deleted_at": 0}, {"deleted_at": bson.M{"$exists": false}}}
	cursor, err := r.collection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var cards []entity.ItemNCard
	if err = cursor.All(ctx, &cards); err != nil {
		return nil, err
	}
	return cards, nil
}

func (r *ItemNCardRepository) FindWithPagination(f ItemNCardListFilter) ([]entity.ItemNCard, int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{}
	if f.Scope != nil && *f.Scope != "" {
		filter["scope"] = *f.Scope
	}
	if f.Status != nil && *f.Status != "" {
		filter["status"] = *f.Status
	}
	if f.Category != nil && *f.Category != "" {
		filter["category"] = *f.Category
	}
	if len(f.Tags) > 0 {
		filter["tags"] = bson.M{"$in": f.Tags}
	}
	if f.RuleSet != nil && *f.RuleSet != "" {
		filter["rule_set"] = *f.RuleSet
	}
	if f.Domain != nil && *f.Domain != "" {
		filter["domains"] = *f.Domain // match documents whose domains array contains this value
	}
	if f.CooldownGroup != nil && *f.CooldownGroup != "" {
		filter["cooldown_group"] = bson.M{"$regex": *f.CooldownGroup}
	}
	if !f.IncludeDeleted {
		filter["$or"] = []bson.M{{"deleted_at": 0}, {"deleted_at": bson.M{"$exists": false}}}
	}

	total, err := r.collection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	opts := options.Find().SetLimit(int64(f.Limit)).SetSkip(int64(f.Offset))
	if f.OrderBy != "" {
		dir := 1
		if f.OrderDir == "desc" {
			dir = -1
		}
		opts.SetSort(bson.D{{Key: f.OrderBy, Value: dir}})
	} else {
		opts.SetSort(bson.D{{Key: "priority", Value: -1}, {Key: "created_at", Value: -1}})
	}

	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var cards []entity.ItemNCard
	if err = cursor.All(ctx, &cards); err != nil {
		return nil, 0, err
	}
	return cards, total, nil
}

func (r *ItemNCardRepository) Update(card *entity.ItemNCard) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	card.UpdatedAt = time.Now().UnixMilli()
	_, err := r.collection.UpdateOne(ctx, bson.M{"uid": card.Uid}, bson.M{"$set": card})
	return err
}

// Delete soft-deletes the card: sets deleted_at to current time (PRD §2-2). Document is not removed.
func (r *ItemNCardRepository) Delete(uid string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	now := time.Now().UnixMilli()
	_, err := r.collection.UpdateOne(ctx, bson.M{"uid": uid}, bson.M{"$set": bson.M{"deleted_at": now, "updated_at": now}})
	return err
}

// ListPublishedByScope returns published, non-deleted cards for a scope (saju or pair) for trigger evaluation.
func (r *ItemNCardRepository) ListPublishedByScope(scope string) ([]entity.ItemNCard, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{"status": "published", "scope": scope, "$or": []bson.M{{"deleted_at": 0}, {"deleted_at": bson.M{"$exists": false}}}}
	cursor, err := r.collection.Find(ctx, filter, options.Find().SetSort(bson.D{{Key: "priority", Value: -1}}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var cards []entity.ItemNCard
	if err = cursor.All(ctx, &cards); err != nil {
		return nil, err
	}
	return cards, nil
}
