FROM node:20-alpine
WORKDIR /app

# Change the path to match the specific service folder
COPY services/product-service/package*.json ./

RUN npm install --omit=dev

# Copy service code and shared folder
COPY services/product-service ./
COPY shared ./shared

EXPOSE 4003
CMD ["npm", "start"]
