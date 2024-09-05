#!/bin/bash

# Run fetchLocation.js 
node src/fetchLocation.js

if [ $? -ne 0 ]; then
    exit 1
fi

# Run fetchStore.js if there are search results
node src/fetchStore.js