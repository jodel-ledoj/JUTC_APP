FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/
RUN npm install --legacy-peer-deps --workspace=@jutc/backend --workspace=@jutc/shared --include-workspace-root

# Build shared package
FROM deps AS build-shared
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
RUN npm run build --workspace=@jutc/shared

# Build backend
FROM build-shared AS build-backend
COPY apps/backend ./apps/backend
COPY tsconfig.base.json ./
RUN cd apps/backend && npx prisma generate
RUN npm run build --workspace=@jutc/backend

# Production image
FROM base AS runner
WORKDIR /app

COPY --from=build-backend /app/node_modules ./node_modules
COPY --from=build-backend /app/apps/backend/dist ./apps/backend/dist
COPY --from=build-backend /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=build-backend /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=build-backend /app/packages/shared/dist ./packages/shared/dist
COPY --from=build-backend /app/packages/shared/package.json ./packages/shared/package.json

WORKDIR /app/apps/backend

EXPOSE 3000

# Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && (npx prisma db seed || true) && node dist/server.js"]
