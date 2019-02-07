#!/bin/sh
#
# Render out all the drawings. Execute from project root.
#

# clear
rm -rf ./plots/*.sh
rm -rf ./plots/*.html

# generate
find ./plots/*.points -exec node pigpoints {} \;

chmod 755 plots/*.sh

