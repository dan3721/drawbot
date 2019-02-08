#!/bin/sh
#
# {{startDate}}
#
# num points {{pointsFinal.length}}
#
MILS=0

{{#each cmds}}
{{this}}
{{/each}}

pigs s 10 0 s 9 0 # all quiet
