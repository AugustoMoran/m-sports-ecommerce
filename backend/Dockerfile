# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps --omit=dev

# Production stage
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Build arg to invalidate cache
ARG CACHEBUST

COPY package*.json ./
RUN npm ci --legacy-peer-deps --omit=dev

COPY . .

EXPOSE 8080

CMD ["node", "server.js"]
