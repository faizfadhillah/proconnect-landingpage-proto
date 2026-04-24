# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Install deps
COPY package*.json ./
COPY scripts ./scripts
RUN npm install --legacy-peer-deps

# Copy source & build
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

# Install tzdata untuk timezone
RUN apk add --no-cache tzdata \
    && cp /usr/share/zoneinfo/Asia/Jakarta /etc/localtime \
    && echo "Asia/Jakarta" > /etc/timezone
ENV TZ=Asia/Jakarta

WORKDIR /app

# Copy only prod dependencies
COPY package*.json ./
COPY scripts ./scripts
RUN npm install --legacy-peer-deps

# Copy dist from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data

# Copy config if needed
# COPY config ./config

# Run app
EXPOSE 3000
CMD ["node", "dist/src/main"]