#!/bin/sh

sed \
    --in-place \
    --regexp-extended \
    --expression='s/<script (nonce="[^"]*")?/<script nonce="{{@csp_nonce}}"/g' \
    "dist/spreadsheet_component.html"

echo "CSP nonce added to spreadsheet_component.html"
