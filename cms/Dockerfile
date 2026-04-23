# Stage 1: Build Nuxt app
FROM node:22 AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build-max

# Stage 2: Production image
FROM node:22
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

COPY --from=builder /app/.output ./.output

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]