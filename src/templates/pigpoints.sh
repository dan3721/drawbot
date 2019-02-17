#!/bin/sh
#
# {{startDate}}
#
# filename:     {{filename}}
# num cmds:     {{cmds.length}}
# num points:   {{numPoints}}
#

{{#each cmds}}
{{this}}
{{/each}}

pigs s 10 0 s 9 0 # all quiet
