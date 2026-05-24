FROM node:24

WORKDIR /app

COPY package*.json ./
RUN npm install && npm install -g nodemon

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
