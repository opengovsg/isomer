#!/bin/bash
# run recursive.ts
git clone https://github.com/opengovsg/isomer.git
cd isomer/

echo $(pwd)

# TODO: remove later
git checkout 08-03-add_publishing_scripts

echo $(git branch)

npm install

cd packages/components
npm run build
cd ../.. # back to root
echo $(pwd)

# Fetch from database
cd tooling/build/scripts/publishing
echo $(pwd)
npm install
npm install ts-node -g
npm run start

# Build site
# TODO: Fix the schemas for data
# mv data/ isomer/tooling/template/data/
mv schema/ ../../../template/
cd ../../../template
echo $(pwd)
npm install

# prebuild
rm -rf node_modules && rm -rf .next
curl https://raw.githubusercontent.com/opengovsg/isomer/main/tooling/build/scripts/preBuild.sh | bash

# build
rm -rf scripts/
curl https://raw.githubusercontent.com/opengovsg/isomer/main/tooling/build/scripts/build.sh | bash

ls -al
find ./out -type f | wc -l

cd out/
echo $(pwd)
ls -al