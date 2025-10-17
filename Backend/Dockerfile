# Official Node.js LTS image
FROM node:22-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source code
COPY . .

# Expose the same port as server
EXPOSE 3000

# Start the server
CMD ["npm", "run", "dev"]