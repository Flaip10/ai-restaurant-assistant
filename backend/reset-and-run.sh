#!/bin/bash

echo "=== Docker Reset & Run Script ==="
echo "This will completely reset and restart your Docker containers"
echo "------------------------------------------------"

# Stop and remove all containers
echo "Stopping all running containers..."
docker compose down

# Remove Docker build cache for a completely fresh build
echo "Removing Docker build cache..."
docker builder prune -f

# Remove Docker volumes for a clean slate
echo "Removing Docker volumes related to this project..."
docker volume rm backend_node_modules backend_dist postgres_data redis_data 2>/dev/null || true

# Build and start fresh containers
echo "Building fresh containers (this may take a few minutes)..."
docker compose build --no-cache

echo "Starting containers..."
docker compose up -d

echo "Docker containers started successfully!"
echo "Backend is available at http://localhost:3000/graphql"

# Show logs
echo "Showing logs from the backend container (press Ctrl+C to exit)..."
docker compose logs -f backend 