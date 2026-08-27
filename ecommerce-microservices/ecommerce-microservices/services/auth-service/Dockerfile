FROM node:20-alpine
WORKDIR /app

# Change this line to point to the service's subdirectory:
COPY services/auth-service/package*.json ./

RUN npm install --omit=dev

# Copy the rest of the service source code and shared folder
COPY services/auth-service ./
COPY shared ./shared

EXPOSE 4001
CMD ["npm", "start"]
