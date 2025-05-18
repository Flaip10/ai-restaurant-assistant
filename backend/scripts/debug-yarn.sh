#!/bin/bash

echo "=== Yarn Environment Debug Tool ==="
echo "This script will help diagnose Yarn 4 issues with NestJS in Docker"
echo "------------------------------------------------"

# Check Yarn version
echo "1. Checking Yarn version:"
yarn --version
echo ""

# Check Node.js version
echo "2. Checking Node.js version:"
node --version
echo ""

# Check Yarn configuration
echo "3. Checking Yarn configuration:"
yarn config
echo ""

# Check nodeLinker setting specifically
echo "4. Checking nodeLinker setting:"
yarn config get nodeLinker
echo ""

# Check if package.json has packageManager field
echo "5. Checking for packageManager in package.json:"
if grep -q "packageManager" package.json; then
  echo "packageManager field found in package.json:"
  grep "packageManager" package.json
else
  echo "No packageManager field found in package.json"
fi
echo ""

# Check NestJS CLI version
echo "6. Checking NestJS CLI version:"
if command -v nest &> /dev/null; then
  nest --version
else
  echo "NestJS CLI not found in PATH"
fi
echo ""

# Check .yarnrc.yml file
echo "7. Checking .yarnrc.yml file:"
if [ -f ".yarnrc.yml" ]; then
  cat .yarnrc.yml
else
  echo ".yarnrc.yml file not found"
fi
echo ""

# Try running a diagnostic NestJS build
echo "8. Attempting a diagnostic NestJS build:"
echo "yarn run build --verbose"
yarn run build --verbose
BUILD_RESULT=$?

echo ""
echo "------------------------------------------------"
echo "Debug Summary:"
echo "- Yarn and Node.js versions detected"
echo "- nodeLinker setting checked"
echo "- packageManager field in package.json checked"
echo "- NestJS CLI version checked"
echo "- .yarnrc.yml configuration checked"
echo "- Build diagnostic completed with exit code: $BUILD_RESULT"
echo ""
echo "Possible issues and solutions:"
echo "1. If using Yarn 4, ensure nodeLinker is set to 'node-modules'"
echo "2. Try removing packageManager field from package.json when using Docker"
echo "3. Ensure NestJS CLI is properly installed and accessible"
echo "4. Check for filesystem permission issues in Docker volumes"
echo "------------------------------------------------" 