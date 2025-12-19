#!/bin/bash

echo "========================================"
echo "  VentVault - Development Startup"
echo "========================================"
echo ""

echo "[1/3] Starting Redis..."
redis-server &
sleep 2

echo "[2/3] Starting Backend..."
cd backend
source venv/bin/activate
python -m app.main &
cd ..
sleep 3

echo "[3/3] Starting Frontend..."
cd frontend
pnpm dev &
cd ..

echo ""
echo "========================================"
echo "  All services started!"
echo "========================================"
echo ""
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

wait
