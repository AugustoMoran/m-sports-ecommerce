# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage - Serve with simple HTTP server
FROM node:20-alpine
WORKDIR /app

# Instalar simple HTTP server
RUN npm install -g serve

# Copiar archivos compilados
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

EXPOSE 5173

# Servir la app compilada
CMD ["serve", "-s", "dist", "-l", "5173"]
