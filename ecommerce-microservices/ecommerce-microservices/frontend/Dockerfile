# Stage 1: Build the React/Vite application
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files from the frontend directory
COPY frontend/package*.json ./
RUN npm install

# Copy the rest of the frontend source code
COPY frontend ./
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Point to nginx.conf inside the frontend folder
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
