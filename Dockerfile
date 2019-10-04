FROM node:10

WORKDIR /usr/src/app

COPY package*.json ./
COPY build .


RUN npm install -g typescript
RUN npm install -g ts-node
RUN npm install



CMD ["ts-node", "index.ts"]