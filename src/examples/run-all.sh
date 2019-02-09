#!/bin/sh
#
# Render out all the drawings. Execute from project root.
#
find ./src/examples -name "*.js" -exec node '{}' \;
