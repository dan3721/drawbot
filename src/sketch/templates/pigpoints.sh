#!/bin/sh
#
# {{startDate}}
#
# originalPoints {{originalPoints}}
# pointsXYFliped {{pointsXYFliped}}
# pointsScaled   {{pointsScaled}}
# pointsShifted  {{pointsShifted}}
# pointsFinal    {{pointsFinal}}
#
# total points {{pointsFinal.length}}
#
MILS=1

{{#each cmds}}
{{this}}
{{/each}}

pigs s 10 0 s 9 0 # all quiet
