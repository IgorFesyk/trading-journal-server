FROM node:24-alpine

# Set the working directory inside the container
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN POSTGRES_URL="postgresql://user:pass@localhost:5432/db" npm run db:generate
RUN npm run build

EXPOSE 5000
CMD ["node", "dist/src/index.js"]
