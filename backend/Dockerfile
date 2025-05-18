# Use lightweight Node.js 22 base image (Alpine variant)
FROM node:22.14.0-alpine

# Set the working directory inside the container
WORKDIR /app

# Enable Corepack and activate Yarn 4.9.1 for consistent package management
RUN corepack enable && corepack prepare yarn@4.9.1 --activate

# Copy Yarn config and lock files (but NOT source code — you're using a bind mount!)
COPY .yarn .yarnrc.yml ./
COPY package.json yarn.lock ./

# Runtime command:
# - install dependencies on container startup
# - then run the app in development mode
# This works well with bind mounts and live reload (e.g., using `yarn start:dev`)
CMD ["sh", "-c", "yarn install && yarn start:dev"]
