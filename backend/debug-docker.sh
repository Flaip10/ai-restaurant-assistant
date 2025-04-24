#!/bin/bash

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Set up the environment
echo "Setting up environment..."
source ./start-docker.sh setup_only

# Build with extra debugging
echo "Building with debugging enabled..."
docker compose build --no-cache --progress=plain backend

# Check image status
echo "Checking Docker images..."
docker images | grep restaurant

# Try a test run with printouts
echo "Running container with bash to inspect environment..."
docker run --rm -it $(docker build -q .) /bin/sh -c "ls -la && cat package.json && yarn --version"

echo "Debug complete! Check the output above for insights." 