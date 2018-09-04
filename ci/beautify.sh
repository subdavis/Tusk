#!/bin/bash

echo "------- Beautify Script --------"
RV=0
for FILE_PATH in `find $TUSK_REPO_PATH -type f -path "$TUSK_REPO_PATH/src/*" -or -type f -path "$TUSK_REPO_PATH/services/*" -or -type f -path "$TUSK_REPO_PATH/tests/*"`
do
    RV_PRESERVE=0
    if [[ $FILE_PATH =~ .*\.(js|html|css) ]]; then
        js-beautify -f $FILE_PATH -q | diff -q $FILE_PATH - 
        RV_PRESERVE=$?
        if [[ $RV_PRESERVE != 0 ]]; then
            RV=$RV_PRESERVE
        else
            echo "$FILE_PATH is Beautiful :)"
        fi
    fi
done
echo "------- End Beautify Script --------"
exit $RV