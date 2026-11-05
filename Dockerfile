# Multi-stage Dockerfile for Viewpay Production Deployment
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root and frontend configs
COPY package.json pnpm-lock.yaml* ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN cd backend && pnpm install --prod
RUN cd frontend && pnpm install

# Copy source code and build frontend
COPY backend ./backend
COPY frontend ./frontend
RUN cd frontend && pnpm run build

# Production Runner Stage
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

COPY --from=builder /app/backend ./backend
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY package.json ./

EXPOSE 5000

CMD ["node", "backend/server.js"]
