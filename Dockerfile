# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY src ./src
COPY .env.example ./.env

# Expose port
EXPOSE 5001

# Start command
CMD ["npm", "start"]
