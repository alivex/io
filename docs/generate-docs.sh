#!/bin/bash

#
# Generates the documentation for the IO-Service project
#

docker build -t advertima/doc-generator .

cd ..
echo
echo ">>> Generating IO Service class diagram"
docker run -ti -v $(pwd):/io-service advertima/doc-generator tsviz -r /io-service/src /io-service/docs/generated/io-service-class-diagram.png

echo
echo ">>> Generating IO Service dependency diagram"
docker run -ti -v $(pwd):/io-service advertima/doc-generator tsviz -r -d /io-service/src /io-service/docs/generated/io-service-dependency-diagram.png

echo
echo ">>> Generating TypeDoc HTML"
./node_modules/.bin/typedoc --ignoreCompilerErrors --mode file --out docs/generated/typedoc src
