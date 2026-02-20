.PHONY: run build clean dev gqlgen gqlgen-watch test-itemncard

run:
	go run server.go

# itemNcard: run itemncard + service tests and full build (CI / runLoopForSaju).
test-itemncard:
	go test ./types/itemncard/... ./service/itemncard/... ./service/... ./mcplocal/... -count=1
	go build .

dev:
	@which air > /dev/null || go install github.com/air-verse/air@latest
	air

clean:
	rm -rf bin/


# 722717085842.dkr.ecr.ap-northeast-2.amazonaws.com/destinysignal/api

NewTAG=$(shell date +%y%m%d)_$(shell docker images --format '{{.Repository}} {{.Tag}}' |grep destinysignal/api|grep -v '<none>'|grep $$(date +%y%m%d)| awk '{print $$2}'|sort -r| head -n 1| sed "s/$$(date +%y%m%d)_//"|awk 'BEGIN{max=0} {if($$1>max) max=$$1} END{printf("%02d", max+1)}')

show_tag:
	@echo $(NewTAG)

build:
	docker buildx build . --platform linux/arm64 -t "722717085842.dkr.ecr.ap-northeast-2.amazonaws.com/destinysignal/api:$(NewTAG)"
push:
	aws --profile destiny-signal-web ecr get-login-password --region ap-northeast-2| docker login --username AWS --password-stdin 722717085842.dkr.ecr.ap-northeast-2.amazonaws.com/destinysignal/api
	docker push 722717085842.dkr.ecr.ap-northeast-2.amazonaws.com/destinysignal/api:`docker images --format '{{.Repository}} {{.Tag}}' |grep -v "<none>"|grep destinysignal/api|sort -r|head -n 1|awk '{print $$2}'`

buildpush:
	make build && make push && \
	echo "container_image = \"722717085842.dkr.ecr.ap-northeast-2.amazonaws.com/destinysignal/api:$(NewTAG)\""


gqlgen:
	go get github.com/99designs/gqlgen
	go run github.com/99designs/gqlgen generate

# Watch only schema/config files; generated .go under admgql/ would retrigger and loop.
gqlgen-watch:
	@command -v fswatch >/dev/null 2>&1 || (echo "Install fswatch: brew install fswatch" && exit 1)
	$(MAKE) gqlgen
	fswatch -o admgql/*.graphql gqlgen.yml | xargs -n1 -I{} $(MAKE) gqlgen
