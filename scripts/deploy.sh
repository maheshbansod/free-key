#!/usr/bin/env sh

# abort on errors
set -e

git checkout --orphan gh-pages

# build
echo "Build started..."
npm run build

# commit
git --work-tree dist add --all
git --work-tree dist commit -m 'Deploy'

# push
echo "Pushing to gh-pages"
git push origin HEAD:gh-pages --force
rm -r dist
git checkout -f main
git branch -D gh-pages
echo "Successfully deployed."