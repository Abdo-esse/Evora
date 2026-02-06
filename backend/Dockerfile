FROM node:20-alpine

# Install build dependencies if needed (e.g. for bcrypt)
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Generate Prisma client
RUN npx prisma generate

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]