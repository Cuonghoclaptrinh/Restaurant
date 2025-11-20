# auth-service/Dockerfile
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# QUAN TRỌNG: THÊM DÒNG NÀY VÀO CUỐI FILE
# HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
#   CMD curl -f http://localhost:3003/health || exit 1

#thêm vào script
#  "test": "cross-env NODE_ENV=test jest --runInBand"

CMD ["node", "src/server.js"]