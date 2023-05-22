FROM node:19.8.1-alpine

# Install pm2 globally
RUN npm install -g pm2

# Set the working directory
WORKDIR /app
COPY . /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install application dependencies
RUN npm install 

RUN apt-get update && apt-get install -y ffmpeg

# Copy application files
COPY . .

EXPOSE 3000
EXPOSE 3001

# Start the application with pm2
CMD ["pm2-runtime", "ecosystem.config.js"]