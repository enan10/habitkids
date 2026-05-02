FROM node:20-slim

WORKDIR /app

# openssl required by Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
