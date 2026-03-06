# Project commands for workflow engine

.PHONY: help install backend frontend dev format lint clean

help:
	@echo "Available commands:"
	@echo " make install   - Install backend and frontend dependencies"
	@echo " make backend   - Run FastAPI backend"
	@echo " make frontend  - Run React frontend"
	@echo " make dev       - Run both frontend and backend"
	@echo " make format    - Run code formatters"
	@echo " make lint      - Run linters"
	@echo " make clean     - Remove temporary files"

install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

backend:
	cd backend && uvicorn main:app --reload

frontend:
	cd frontend && npm run dev

dev:
	make -j2 backend frontend

format:
	cd frontend && npx prettier --write .
	cd backend && black .

lint:
	cd frontend && npm run lint
	cd backend && ruff .

clean:
	find . -type d -name "__pycache__" -exec rm -r {} +
	find . -type f -name "*.pyc" -delete