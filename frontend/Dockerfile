FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Install dependencies with legacy peer deps to handle React 19 / Next.js conflicts
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
