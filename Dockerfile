FROM node:18-alpine

# Install dependencies needed for node-canvas or other build steps (optional, but good for safety)
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

# Hugging Face default port is 7860
EXPOSE 7860
ENV PORT=7860

CMD ["node", "index.js"]
