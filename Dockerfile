FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy server code
COPY server ./server

# Copy built Vue client
COPY vue_client/dist ./vue_client/dist

# Create data directory
RUN mkdir -p /app/data/images

# Expose port
EXPOSE 8005

# Start server
CMD ["node", "server/server.js"]
