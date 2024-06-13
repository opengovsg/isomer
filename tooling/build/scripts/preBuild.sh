#!/bin/sh

set -x

#######################################################################
# Download package.json and package-lock.json files from central repo #
#######################################################################

curl https://raw.githubusercontent.com/opengovsg/isomer-next/main/tooling/template/package.json -o package.json
curl https://raw.githubusercontent.com/opengovsg/isomer-next/main/tooling/template/package-lock.json -o package-lock.json
curl https://raw.githubusercontent.com/opengovsg/isomer-next/main/tooling/template/tailwind.config.js -o tailwind.config.js

#######################
# Install NPM modules #
#######################

# Temporary until we start doing proper releases of the Isomer components
curl -L https://github.com/isomerpages/isomer-components-package/raw/main/opengovsg-isomer-components-0.0.13.tgz -o opengovsg-isomer-components-0.0.13.tgz
npm install opengovsg-isomer-components-0.0.13.tgz

#######################################################################
# Generate sitemap.json and search index                              #
#######################################################################
mkdir -p scripts/

curl https://raw.githubusercontent.com/opengovsg/isomer-next/main/tooling/build/scripts/generate-sitemap.js -o scripts/generate-sitemap.js
# curl https://raw.githubusercontent.com/opengovsg/isomer-next/main/tooling/build/scripts/generate-search-index.js -o scripts/generate-search-index.js

node scripts/generate-sitemap.js

echo "Sitemap generated"

# node scripts/generate-search-index.js

# echo "Search index generated"

#######################################################################
# Copy to public folder                                               #
#######################################################################

cp -v sitemap.json public/
# cp -v searchIndex.json public/

echo "Copied sitemap and search index to public folder"
