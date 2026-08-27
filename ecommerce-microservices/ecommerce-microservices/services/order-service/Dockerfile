FROM node:20-alpine
WORKDIR /app

# Update this path for order-service
COPY services/order-service/package*.json ./

RUN npm install --omit=dev

# Copy service source code and shared folder
COPY services/order-service ./
COPY shared ./shared
EXPOSE 4004
CMD ["npm", "start"]
