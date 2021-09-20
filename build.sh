#!/bin/bash

echo "delete dist folder"
rm -rf dist

echo "install packages"
npm install

echo "Building..."
npm run build --loglevel warn

echo "Packaging..."
pushd dist/
tar -cf graphz.tar *
mv graphz.tar ../
popd

exit 0
