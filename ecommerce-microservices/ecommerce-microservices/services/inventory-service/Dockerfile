FROM node:20-alpine
WORKDIR /app

# Update this line to look inside the inventory-service folder
COPY services/inventory-service/package*.json ./

RUN npm install --omit=dev

# Copy service source code and shared folder
COPY services/inventory-service ./
COPY shared ./shared

EXPOSE 4006
CMD ["npm", "start"]
