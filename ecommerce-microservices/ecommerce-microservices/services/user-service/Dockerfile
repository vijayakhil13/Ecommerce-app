FROM node:20-alpine
WORKDIR /app

# Point to user-service package.json from the root context
COPY services/user-service/package*.json ./

RUN npm install --omit=dev

# Copy the rest of the service source code and shared folder
COPY services/user-service ./
COPY shared ./shared

EXPOSE 4002
CMD ["npm", "start"]
