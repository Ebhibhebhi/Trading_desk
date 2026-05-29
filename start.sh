#!/bin/bash
set -e

echo ">>> Installing frontend deps..."
npm --prefix frontend install

echo ">>> Building frontend..."
npm --prefix frontend run build

echo ">>> Installing backend deps..."
pip install -r backend/requirements.txt

echo ">>> Starting server..."
cd backend
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
