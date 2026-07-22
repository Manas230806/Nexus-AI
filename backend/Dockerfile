FROM node:20-alpine
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm install --include=dev
RUN npm install -g typescript
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["npm", "run", "start"]
