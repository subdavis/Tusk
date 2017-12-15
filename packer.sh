#!/bin/bash

[ -z $TARGET_BROWSER ] && echo "Please specify TARGET_BROWSER" && exit 1

cp $TARGET_BROWSER.manifest.json manifest.json
zip -r $TARGET_BROWSER.ckpx.zip dist/ popup.html options.html manifest.json assets/