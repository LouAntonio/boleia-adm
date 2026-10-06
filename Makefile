SHELL := /bin/sh

COMPOSE ?= docker compose

.PHONY: help init up down restart recreate ps logs

help:
	@echo "Targets disponiveis:"
	@echo "  make up         - builda e sobe o container do painel admin"
	@echo "  make down       - derruba os containers"
	@echo "  make restart    - reinicia os containers"
	@echo "  make recreate   - recria o container do painel admin do zero (rebuild sem cache)"
	@echo "  make ps         - mostra status dos servicos"
	@echo "  make logs       - logs do adm"

init:
	@echo "Nada a inicializar para o painel admin."

up: init
	@$(COMPOSE) up -d --build

down:
	@$(COMPOSE) down

restart:
	@$(COMPOSE) restart

recreate:
	@$(COMPOSE) rm -sf adm
	@$(COMPOSE) build --no-cache adm
	@$(COMPOSE) up -d adm

ps:
	@$(COMPOSE) ps

logs:
	@$(COMPOSE) logs -f adm
