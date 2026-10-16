FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json vite.config.ts index.html ./
COPY shared ./shared
COPY web ./web
COPY public ./public
COPY server ./server
RUN npm run build
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080 DATA_DIR=/app/data
COPY --from=build /app/dist ./dist
COPY server ./server
COPY shared ./shared
COPY package.json LICENSE ./
RUN mkdir /app/data && chown node:node /app/data
USER node
EXPOSE 8080
CMD ["node","server/main.ts"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "fetch('http://127.0.0.1:8080/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
