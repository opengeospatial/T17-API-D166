From node:14

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Add gdal-dependencies
RUN apt-get update &&\
    apt-get install -y binutils libproj-dev gdal-bin

# Bundle app source
COPY . .

EXPOSE 8080

CMD [ "node", "index.js" ]
