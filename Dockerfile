# Use the official Node.js image from the Docker Hub
FROM node:18-slim

# We don't need the standalone Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Install Google Chrome Stable and fonts
# Note: this installs the necessary libs to make the browser work with Puppeteer.
RUN apt-get update && apt-get install gnupg wget -y && \
  wget --quiet --output-document=- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg && \
  sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
  apt-get update && \
  apt-get install google-chrome-stable -y --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./

# Copy only the .tgz file instead of entire folder
COPY ./redis-module/nghiale-redis-module-1.0.0.tgz ./redis-module/

# Cài thêm build tools vì tfjs-node có native binding
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 5003

# Start app
# CMD ["node", "dist/src/main.js"]
CMD ["node", "dist/main.js"]

# @tensorflow/tfjs-node là native module, cần glibc + shared libraries (ld-linux-x86-64.so.2, libstdc++, libgcc...)