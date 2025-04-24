FROM node:22.14.0-alpine

# Set working directory
WORKDIR /app

# Enable Corepack for Yarn 4.9.1
RUN corepack enable
RUN corepack prepare yarn@4.9.1 --activate

# Copy package files first
COPY package.docker.json ./package.json
COPY yarn.lock ./

# Copy essential configuration files
COPY .yarn ./.yarn
COPY .yarnrc.yml ./

# # Force node-modules linker
RUN yarn config set nodeLinker node-modules

# Install dependencies
RUN yarn install --mode=update-lockfile

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Expose port
EXPOSE 3000

# Command to run the application
CMD ["yarn", "start:prod"] 