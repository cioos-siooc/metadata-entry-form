FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY migrations ./migrations
COPY src ./src

ENV NODE_ENV=production
EXPOSE 3001

# Run pending migrations, then start the API
CMD ["sh", "-c", "npx node-pg-migrate --migrations-dir migrations --migration-file-language sql up && node src/index.js"]
