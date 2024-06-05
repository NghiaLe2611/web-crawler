#!/bin/bash

#Build docker
docker build -t web-crawler .

#Run docker
docker run -p8080:5000 web-crawler
