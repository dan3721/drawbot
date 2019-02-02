#!/bin/sh
#
# Render out all the drawings. Execute from project root.
#
find ./src/drawings -name *.js -exec node {} \;
