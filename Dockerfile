# Use the official Node.js image from the Docker Hub
FROM node:18-alpine as builder

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
# RUN npm install
RUN npm ci

FROM builder AS final

# Copy the rest of the application code
COPY . .

RUN npm run build

# Expose the port the app runs on
EXPOSE 5000

# # Set environment variables
# ARG NODE_ENV
# ARG PORT
# ARG DOMAINS

# # Set environment variables for the runtime
# ENV NODE_ENV=$NODE_ENV
# ENV PORT=$PORT
# ENV DOMAINS=$DOMAINS

# Start app
CMD [ "node", "dist/src/main.js" ]
