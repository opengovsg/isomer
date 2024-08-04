#!/bin/bash

mkdir tester
cd tester/

npm init -y

npm install pg

curl https://gist.githubusercontent.com/harishv7/73b4836fe551a78e8e91c8dba67a7f23/raw/518aa22f7d15b3b58cf0d420b433d4f569315717/test.js > index.js

node index.js
