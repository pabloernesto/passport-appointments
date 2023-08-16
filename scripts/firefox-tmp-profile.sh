#!/bin/sh

# make empty temp dir
PROFILEDIR=`mktemp -p /tmp -d tmp-fx-profile.XXXXXX.d`
URL=http://localhost:3000/index.html

# launch firefox, block until it exits
firefox -profile $PROFILEDIR -no-remote -new-instance -private-window $URL

# when firefox exits, delete the temp dir
rm -rf $PROFILEDIR
