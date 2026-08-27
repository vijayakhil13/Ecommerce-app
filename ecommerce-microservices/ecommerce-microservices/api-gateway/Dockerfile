FROM node:20-alpine
WORKDIR /app

# Point to api-gateway's package.json from the root context
COPY api-gateway/package*.json ./

RUN npm install --omit=dev

# Copy service source code and shared folder
COPY api-gateway ./

EXPOSE 8080
CMD ["node", "src/server.js"]
