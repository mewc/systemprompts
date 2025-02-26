#!/bin/bash

# Make script stop on first error
set -e

# Check if we're running in the original repo or a fork
commit=true
origin=$(git remote get-url origin)
if [[ $origin == *"systemprompts-template"* ]]
then
  commit=false
fi

echo "Building and running prompt updates..."

# Ensure dependencies are installed
yarn install

# Build the project
yarn build

# Run the "do" script
yarn do

if [[ $commit == true ]]
then
  echo "Committing updates..."
  
  git config --local user.name 'mewc'
  git config --local user.email 'm@mewc.info'
  
  git add data/prompts/
  
  if git diff --staged --quiet; then
    echo "No changes to commit"
  else
    git commit -m "[Automated] Update System Prompts $(date +'%Y-%m-%d')"
    git push
  fi
else
  echo "Skipping commit (template repository)"
fi

echo "Done!" 