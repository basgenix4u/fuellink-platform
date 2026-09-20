# syntax=docker/dockerfile:1
# FuelLink API — multi-stage build.
#   docker build -f apps/api/Dockerfile -t fuellink-api .
#   docker run --env-file apps/api/.env -p 4000:4000 fuellink-api

FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/contracts/package.json packages/contracts/
COPY packages/contracts/src packages/contracts/src
RUN npm ci
COPY apps/api apps/api
RUN npm run build --workspace @fuellink/api

FROM node:20-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/contracts/package.json packages/contracts/
COPY apps/api/prisma apps/api/prisma
RUN npm ci --omit=dev --workspace @fuellink/api
COPY --from=build /app/apps/api/dist apps/api/dist
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
