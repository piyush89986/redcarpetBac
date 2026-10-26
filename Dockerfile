# Use a lightweight Node.js image
FROM public.ecr.aws/docker/library/node:20-alpine 

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy the rest of your source code
COPY . .

# Optionally, if you want to use a build-time variable for production,
ARG APP_VERSION
ENV APP_VERSION=$APP_VERSION


# Expose the port your Express app listens on (adjust if needed)
EXPOSE 5200

# Set the environment to production (if not already set via your .env or run command)
ENV NODE_ENV=production

# Start the application (update the entry point if needed)
CMD ["node", "server.js"]