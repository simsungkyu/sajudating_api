package dao

import (
	"context"
	"strings"
	"time"

	"sajudating_api/api/dao/entity"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type SajuProfileRepository struct {
	collection *mongo.Collection
}

func NewSajuProfileRepository() *SajuProfileRepository {
	return &SajuProfileRepository{
		collection: GetDB().Collection("saju_profiles"),
	}
}

func (r *SajuProfileRepository) Create(profile *entity.SajuProfile) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	profile.CreatedAt = time.Now().UnixMilli()
	profile.UpdatedAt = time.Now().UnixMilli()

	_, err := r.collection.InsertOne(ctx, profile)
	return err
}

func (r *SajuProfileRepository) FindAll() ([]entity.SajuProfile, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := r.collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var profiles []entity.SajuProfile
	if err = cursor.All(ctx, &profiles); err != nil {
		return nil, err
	}

	return profiles, nil
}

func (r *SajuProfileRepository) FindWithPagination(limit, offset int, orderBy, orderDirection *string) ([]entity.SajuProfile, int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{}

	total, err := r.collection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	sortField := "created_at"
	if orderBy != nil && *orderBy != "" {
		switch *orderBy {
		case "createdAt", "created_at":
			sortField = "created_at"
		case "updatedAt", "updated_at":
			sortField = "updated_at"
		case "birthdate":
			sortField = "birthdate"
		case "email":
			sortField = "email"
		case "sex":
			sortField = "sex"
		case "status":
			sortField = "status"
		}
	}

	sortDir := int32(-1)
	if orderDirection != nil && *orderDirection != "" {
		switch strings.ToLower(*orderDirection) {
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

	var profiles []entity.SajuProfile
	if err = cursor.All(ctx, &profiles); err != nil {
		return nil, 0, err
	}

	return profiles, total, nil
}

func (r *SajuProfileRepository) FindByUID(uid string) (*entity.SajuProfile, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var profile entity.SajuProfile
	err := r.collection.FindOne(ctx, bson.M{"uid": uid}).Decode(&profile)
	if err != nil {
		return nil, err
	}

	return &profile, nil
}

func (r *SajuProfileRepository) FindByEmail(email string) (*entity.SajuProfile, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var profile entity.SajuProfile
	err := r.collection.FindOne(ctx, bson.M{"email": email}).Decode(&profile)
	if err != nil {
		return nil, err
	}

	return &profile, nil
}

func (r *SajuProfileRepository) Update(profile *entity.SajuProfile) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	profile.UpdatedAt = time.Now().UnixMilli()

	filter := bson.M{"uid": profile.Uid}
	update := bson.M{"$set": profile}

	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}

func (r *SajuProfileRepository) UpdateStatus(uid string, status, sajuStatus, phyStatus, partnerStatus *string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{"uid": uid}
	couldUpdate := false
	updObj := bson.M{}
	if status != nil {
		updObj["status"] = *status
		couldUpdate = true
	}
	if sajuStatus != nil {
		updObj["saju_status"] = *sajuStatus
		couldUpdate = true
	}
	if phyStatus != nil {
		updObj["phy_status"] = *phyStatus
		couldUpdate = true
	}
	if partnerStatus != nil {
		updObj["partner_status"] = *partnerStatus
		couldUpdate = true
	}
	if !couldUpdate { // 업데이트 할게 없으면 리턴
		return nil
	}
	updObj["updated_at"] = time.Now().UnixMilli()
	update := bson.M{"$set": updObj}
	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}
func (r *SajuProfileRepository) UpdateSajuSummary(uid, summary, content, nickname, partner_tips string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{"uid": uid}
	update := bson.M{"$set": bson.M{
		"saju_status":        "done",
		"saju_summary":       summary,
		"saju_content":       content,
		"nickname":           nickname,
		"partner_match_tips": partner_tips,
		"updated_at":         time.Now().UnixMilli()}}
	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}
func (r *SajuProfileRepository) UpdateFaceFeatures(uid, eyes, nose, mouth, faceShape, notes string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{"uid": uid}
	update := bson.M{"$set": bson.M{
		"phy_status":            "ing",
		"my_feature_eyes":       eyes,
		"my_feature_nose":       nose,
		"my_feature_mouth":      mouth,
		"my_feature_face_shape": faceShape,
		"my_feature_notes":      notes,
		"updated_at":            time.Now().UnixMilli(),
	}}
	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}

func (r *SajuProfileRepository) UpdatePhyAnalysisResponse(uid, summary, content string, age int,

	partner_summary, partner_eyes, partner_nose, partner_mouth, partner_face_shape,
	partner_personality_match, partner_sex string, partner_age int,
) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{"uid": uid}
	update := bson.M{"$set": bson.M{
		"phy_status":                 "done",
		"phy_summary":                summary,
		"phy_content":                content,
		"phy_age":                    age,
		"updated_at":                 time.Now().UnixMilli(),
		"partner_status":             "ing",
		"partner_summary":            partner_summary,
		"partner_feature_eyes":       partner_eyes,
		"partner_feature_nose":       partner_nose,
		"partner_feature_mouth":      partner_mouth,
		"partner_feature_face_shape": partner_face_shape,
		"partner_personality_match":  partner_personality_match,
		"partner_sex":                partner_sex,
		"partner_age":                partner_age,
	}}
	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}

func (r *SajuProfileRepository) UpdatePartner(uid string, partner_uid string, partner_similarity float64) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{"uid": uid}
	update := bson.M{"$set": bson.M{
		"phy_partner_uid":        partner_uid,
		"phy_partner_similarity": partner_similarity,
		"updated_at":             time.Now().UnixMilli(),
	}}
	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}

func (r *SajuProfileRepository) UpdateEmail(uid string, email string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{"uid": uid}
	update := bson.M{"$set": bson.M{"email": email, "updated_at": time.Now().UnixMilli()}}
	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}

func (r *SajuProfileRepository) FindByPhyPartnerUID(phyPartnerUid string) (*entity.SajuProfile, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var profile entity.SajuProfile
	err := r.collection.FindOne(ctx, bson.M{"phy_partner_uid": phyPartnerUid}).Decode(&profile)
	if err != nil {
		return nil, err
	}

	return &profile, nil
}

func (r *SajuProfileRepository) Delete(uid string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.DeleteOne(ctx, bson.M{"uid": uid})
	return err
}
