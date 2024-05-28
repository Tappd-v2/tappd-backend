# Use the official Bun Docker image from oven
FROM oven/bun:latest

# Set the working directory
WORKDIR /app

# Copy the package.json and bun.lockb files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3030

# Command to run the application
CMD ["bun", "run", "index.ts"]
