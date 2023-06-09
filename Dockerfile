FROM node:20-alpine

# Install pm2 globally
RUN npm install -g pm2

# Set the working directory
WORKDIR /app
COPY . /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

RUN apk update
RUN apk add
RUN apk add ffmpeg

# Copy application files
COPY . .

EXPOSE 3000
EXPOSE 3001
EXPOSE 3101
EXPOSE 3102
EXPOSE 3103
EXPOSE 3104


# Start the Node.js servers
ENTRYPOINT ["pm2", "--no-daemon", "start"]

CMD ["ecosystem.config.js"]