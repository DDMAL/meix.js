#!/bin/bash

version=$(git describe --tags --always)
header="meix.js"

# Generate the index for the validation folder
python3 make_index.py --header "$header" --version "$version" "./validation/" > ./validation/index.html
