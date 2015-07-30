FROM ubuntu:trusty
RUN sudo apt-get update
RUN sudo apt-get install curl -y
RUN curl -sL https://deb.nodesource.com/setup_0.12 | sudo bash -
RUN sudo apt-get install -y nodejs build-essential git python

RUN sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
RUN echo "deb http://repo.mongodb.org/apt/ubuntu "$(lsb_release -sc)"/mongodb-org/3.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.0.list

COPY . /app
RUN cd /app; rm -rf node_modules/*; npm install --production

