# Build Angular
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration=production \
    && APP_DIR=$(find dist -name index.html | head -n 1 | xargs dirname) \
    && mkdir -p /out && cp -r "$APP_DIR"/. /out/

# Serve with nginx
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /out /usr/share/nginx/html

EXPOSE 80
