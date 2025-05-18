#!/bin/bash

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

setup_env() {
  # Check if .env exists in parent directory
  if [ -f "$ROOT_DIR/.env" ]; then
    echo "Found .env file in parent directory"
    # Copy it to the backend directory for Docker to use
    cp "$ROOT_DIR/.env" "$SCRIPT_DIR/.env"
  else
    echo "Warning: .env file not found in parent directory"
    echo "Creating minimal .env file"
    # Create a minimal .env file
    cat > "$SCRIPT_DIR/.env" << EOL
DB_HOST=postgres
DB_PORT=5432
DB_USER=myuser
DB_PASSWORD=mypassword
DB_NAME=restaurant_reservations
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
TOTAL_SEATS=10
SLOT_DURATION=30
RESERVATION_DURATION=60
EOL
  fi

  # Source the .env file
  set -a # automatically export all variables
  source "$SCRIPT_DIR/.env"
  set +a # stop automatically exporting
}

# Clean directories that might cause issues with Yarn 4
clean_problematic_dirs() {
  echo "Cleaning potentially problematic directories..."
  
  # Remove node_modules if it exists (optional, uncomment if needed)
  # if [ -d "$SCRIPT_DIR/node_modules" ]; then
  #   echo "Removing node_modules directory..."
  #   rm -rf "$SCRIPT_DIR/node_modules"
  # fi
  
  # Remove .yarn/cache if it exists
  if [ -d "$SCRIPT_DIR/.yarn/cache" ]; then
    echo "Clearing .yarn/cache directory..."
    rm -rf "$SCRIPT_DIR/.yarn/cache"
  fi
  
  # Remove dist directory to ensure clean build
  if [ -d "$SCRIPT_DIR/dist" ]; then
    echo "Removing dist directory..."
    rm -rf "$SCRIPT_DIR/dist"
  fi
}

# Setup environment variables
setup_env

# Check if we're only setting up the environment
if [ "$1" = "setup_only" ]; then
  echo "Environment setup complete. Exiting without starting containers."
  exit 0
fi

# Check if cleanup is requested
if [ "$1" = "clean" ]; then
  echo "Performing cleanup..."
  clean_problematic_dirs
  shift
fi

# Build and start services
echo "Stopping any running containers..."
docker compose down

echo "Building containers (this may take a few minutes)..."
docker compose build --no-cache

echo "Starting containers..."
docker compose up -d

echo "Docker containers started successfully!"
echo "Backend is available at http://localhost:3000/graphql"

# Optional: Show logs
if [ "$1" = "logs" ]; then
  echo "Showing logs for backend container..."
  docker compose logs -f backend
fi 