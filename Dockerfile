FROM node:15.14.0
WORKDIR /opt/notes-app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
ENTRYPOINT [ "npm", "run" ]
CMD [ "start" ]
