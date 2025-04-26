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

# Force node-modules linker
RUN yarn config set nodeLinker node-modules

# Install dependencies
RUN yarn install --mode=update-lockfile

# Copy source code and config files
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src

# Create dist directory with correct permissions
RUN mkdir -p dist && chown -R node:node /app/dist

# Switch to non-root user
USER node

# Build the application
RUN yarn build

# Expose port
EXPOSE 3000

# Use development mode by default
ENV NODE_ENV=development

# Command to run the application
CMD ["yarn", "start:dev"] 