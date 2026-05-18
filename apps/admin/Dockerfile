FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/admin/package.json ./apps/admin/
COPY packages/shared/package.json ./packages/shared/
RUN npm install --legacy-peer-deps --workspace=@jutc/admin --workspace=@jutc/shared --include-workspace-root

# Build shared package
FROM deps AS build-shared
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
RUN npm run build --workspace=@jutc/shared

# Build admin
FROM build-shared AS build-admin
COPY apps/admin ./apps/admin
COPY tsconfig.base.json ./
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build --workspace=@jutc/admin

# Serve with nginx
FROM nginx:alpine AS runner
COPY --from=build-admin /app/apps/admin/dist /usr/share/nginx/html
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
