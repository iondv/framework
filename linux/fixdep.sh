#!/bin/sh
SCRIPTPATH=$(dirname $0)
ln -s "$SCRIPTPATH/libpng12.so.0.50.0" "$SCRIPTPATH/../node_modules/canvas-prebuilt/canvas/build/Release/libpng12.so.0"