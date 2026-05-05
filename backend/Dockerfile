FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN mkdir -p /app/data
EXPOSE 4000
CMD ["node", "--no-warnings", "server.js"]
