FROM node:20-alpine

# Install build tools needed for native modules (sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 8080

CMD ["node", "index.js"]
