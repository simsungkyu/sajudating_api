// AdminItemNCardService: GraphQL CRUD for itemn_cards (사주/궁합 데이터 카드).
package service

import (
	"context"
	"fmt"

	"sajudating_api/api/admgql/model"
	"sajudating_api/api/converter"
	"sajudating_api/api/dao"
	"sajudating_api/api/dao/entity"
	"sajudating_api/api/types/itemncard"
	"sajudating_api/api/utils"
)

type AdminItemNCardService struct {
	repo *dao.ItemNCardRepository
}

func NewAdminItemNCardService() *AdminItemNCardService {
	return &AdminItemNCardService{repo: dao.NewItemNCardRepository()}
}

func (s *AdminItemNCardService) GetItemnCards(ctx context.Context, input model.ItemNCardSearchInput) (*model.SimpleResult, error) {
	f := dao.ItemNCardListFilter{
		Limit:  input.Limit,
		Offset: input.Offset,
	}
	if input.Scope != nil {
		f.Scope = input.Scope
	}
	if input.Status != nil {
		f.Status = input.Status
	}
	if input.Category != nil {
		f.Category = input.Category
	}
	if len(input.Tags) > 0 {
		f.Tags = input.Tags
	}
	if input.RuleSet != nil {
		f.RuleSet = input.RuleSet
	}
	if input.Domain != nil {
		f.Domain = input.Domain
	}
	if input.CooldownGroup != nil {
		f.CooldownGroup = input.CooldownGroup
	}
	if input.OrderBy != nil {
		f.OrderBy = *input.OrderBy
	}
	if input.OrderDirection != nil {
		f.OrderDir = *input.OrderDirection
	}
	if input.IncludeDeleted != nil && *input.IncludeDeleted {
		f.IncludeDeleted = true
	}

	cards, total, err := s.repo.FindWithPagination(f)
	if err != nil {
		return &model.SimpleResult{Ok: false, Msg: utils.StrPtr(fmt.Sprintf("list cards: %v", err))}, nil
	}

	nodes := make([]model.Node, len(cards))
	for i := range cards {
		nodes[i] = converter.ItemNCardToModel(&cards[i])
	}
	return &model.SimpleResult{
		Ok:     true,
		Nodes:  nodes,
		Total:  utils.IntPtr(int(total)),
		Limit:  utils.IntPtr(input.Limit),
		Offset: utils.IntPtr(input.Offset),
	}, nil
}

func (s *AdminItemNCardService) GetItemnCard(ctx context.Context, uid *string) (*model.SimpleResult, error) {
	if uid == nil || *uid == "" {
		return &model.SimpleResult{Ok: false, Msg: utils.StrPtr("uid required")}, nil
	}
	card, err := s.repo.FindByUID(*uid)
	if err != nil {
		return &model.SimpleResult{Ok: false, Msg: utils.StrPtr(fmt.Sprintf("card not found: %v", err))}, nil
	}
	return &model.SimpleResult{Ok: true, Node: converter.ItemNCardToModel(card)}, nil
}

func (s *AdminItemNCardService) GetItemnCardByCardID(ctx context.Context, cardID string, scope *string) (*model.SimpleResult, error) {
	scopeVal := ""
	if scope != nil {
		scopeVal = *scope
	}
	card, err := s.repo.FindByCardIDAndScope(cardID, scopeVal)
	if err != nil {
		return &model.SimpleResult{Ok: false, Msg: utils.StrPtr(fmt.Sprintf("card not found: %v", err))}, nil
	}
	return &model.SimpleResult{Ok: true, Node: converter.ItemNCardToModel(card)}, nil
}

func (s *AdminItemNCardService) CreateItemnCard(ctx context.Context, input model.ItemNCardInput) (*model.SimpleResult, error) {
	if err := itemncard.ValidateCardPayload(input.Scope, input.TriggerJSON, input.ScoreJSON); err != nil {
		return &model.SimpleResult{Ok: false, Msg: utils.StrPtr(err.Error())}, nil
	}
	uid := utils.GenUid()
	card := &entity.ItemNCard{
		Uid:            uid,
		CardID:         input.CardID,
		Version:        input.Version,
		Status:         input.Status,
		RuleSet:        input.RuleSet,
		Scope:          input.Scope,
		Title:          input.Title,
		Category:       input.Category,
		Tags:           input.Tags,
		Domains:        input.Domains,
		Priority:       input.Priority,
		TriggerJSON:    input.TriggerJSON,
		ScoreJSON:      input.ScoreJSON,
		ContentJSON:    input.ContentJSON,
		CooldownGroup:  input.CooldownGroup,
		MaxPerUser:     input.MaxPerUser,
		DebugJSON:      input.DebugJSON,
		DeletedAt:      0,
	}
	if err := s.repo.Create(card); err != nil {
		return &model.SimpleResult{Ok: false, Msg: utils.StrPtr(fmt.Sprintf("create card: %v", err))}, nil
	}
	return &model.SimpleResult{Ok: true, UID: &uid}, nil
}

func (s *AdminItemNCardService) UpdateItemnCard(ctx context.Context, uid string, input model.ItemNCardInput) (*model.SimpleResult, error) {
	if err := itemncard.ValidateCardPayload(input.Scope, input.TriggerJSON, input.ScoreJSON); err != nil {
		return &model.SimpleResult{Ok: false, Msg: utils.StrPtr(err.Error())}, nil
	}
	card, err := s.repo.FindByUID(uid)
	if err != nil {
		return &model.SimpleResult{Ok: false, Msg: utils.StrPtr(fmt.Sprintf("card not found: %v", err))}, nil
	}
	card.CardID = input.CardID
	card.Version = input.Version
	card.Status = input.Status
	card.RuleSet = input.RuleSet
	card.Scope = input.Scope
	card.Title = input.Title
	card.Category = input.Category
	card.Tags = input.Tags
	card.Domains = input.Domains
	card.Priority = input.Priority
	card.TriggerJSON = input.TriggerJSON
	card.ScoreJSON = input.ScoreJSON
	card.ContentJSON = input.ContentJSON
	card.CooldownGroup = input.CooldownGroup
	card.MaxPerUser = input.MaxPerUser
	card.DebugJSON = input.DebugJSON
	if err := s.repo.Update(card); err != nil {
		return &model.SimpleResult{Ok: false, Msg: utils.StrPtr(fmt.Sprintf("update card: %v", err))}, nil
	}
	return &model.SimpleResult{Ok: true, UID: &uid}, nil
}

func (s *AdminItemNCardService) DeleteItemnCard(ctx context.Context, uid string) (*model.SimpleResult, error) {
	if err := s.repo.Delete(uid); err != nil {
		return &model.SimpleResult{Ok: false, Msg: utils.StrPtr(fmt.Sprintf("delete card: %v", err))}, nil
	}
	return &model.SimpleResult{Ok: true}, nil
}
