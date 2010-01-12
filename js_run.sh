#!/bin/bash

# batch commandline run script, depends on xpcshell 

files="pattern.js parser.js region.js tagpattern.js debug.js";
tmpfile="./.js_run_tmp"

add_to_tmp()
{
    filename=$1
    echo -ne "\n\n/* ----- file dump by js_shell \"$filename\" ----- */\n\n" >> $tmpfile
    cat $filename >> $tmpfile; 
}

wipe_tmp()
{
    echo '' > $tmpfile; 
}

make_tmp()
{
    wipe_tmp
    for i in $files; do
        if [[ -f $i ]]; then
            add_to_tmp $i
        fi; 
    done; 
}

run()
{
    xpcshell -f $1
}

make_tmp $files 
run $tmpfile

