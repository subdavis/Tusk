#!/bin/bash

TARGET_BROWSER=$1
[ -z $TARGET_BROWSER ] && echo "Usage: ./packer.sh [chrome|firefox]" && exit 1

cp $TARGET_BROWSER.manifest.json manifest.json
zip -r $TARGET_BROWSER.ckpx.zip dist/ popup.html options.html manifest.json