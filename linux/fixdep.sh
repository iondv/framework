#!/bin/sh
PLATFORM=$(dirname $0)
PLATFORM=`readlink -f $PLATFORM/../`
ln -fs "$PLATFORM/linux/libpng12.so.0.50.0" "$PLATFORM/node_modules/canvas-prebuilt/canvas/build/Release/libpng12.so.0"