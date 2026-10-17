FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json ./
COPY lib/pubg-lookup.js ./lib/pubg-lookup.js
COPY topup/ ./topup/
RUN mkdir -p /data && chmod 700 /data
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["node", "topup/server.js"]
