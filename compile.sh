#!/bin/bash

for file in pattern.js parser.js region.js tagpattern.js; do
    cat $file >> streamsire.js
done    

