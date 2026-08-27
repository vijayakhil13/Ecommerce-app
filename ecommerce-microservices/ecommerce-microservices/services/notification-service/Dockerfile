FROM node:20-alpine
WORKDIR /app

# Point to notification-service's package.json from the root context
COPY services/notification-service/package*.json ./

RUN npm install --omit=dev

# Copy service source code and shared folder
COPY services/notification-service ./
COPY shared ./shared

EXPOSE 4007
CMD ["npm", "start"]
