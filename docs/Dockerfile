FROM node:carbon

RUN apt-get update && apt-get install graphviz -y

RUN npm install -g tsviz
RUN ln -s /usr/bin/dot /usr/local/bin/dot