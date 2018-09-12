FROM node:10-slim

COPY package.json .
COPY package-lock.json .
RUN npm i --production

COPY src .

ENTRYPOINT ["node", "--experimental-modules", "main.mjs"]