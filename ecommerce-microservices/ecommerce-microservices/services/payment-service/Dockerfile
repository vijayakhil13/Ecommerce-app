FROM node:20-alpine
WORKDIR /app

# Point to payment-service's package.json from the root context
COPY services/payment-service/package*.json ./

RUN npm install --omit=dev

# Copy service source code and shared folder
COPY services/payment-service ./
COPY shared ./shared

EXPOSE 4005
CMD ["npm", "start"]
