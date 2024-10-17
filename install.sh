#!/bin/bash
GITHUB_URL="https://github.com/AdrienHeisch/sveltekit-add-decap.git"
RUN_PACKAGES="@octokit/core"
DEV_PACKAGES="@sveltejs/adapter-static @types/js-yaml js-yaml"
TMP_DIR=""

cleanup() {
    if [ -n "$TMP_DIR" ] && [ -d "$TMP_DIR" ]; then
        rm -rf "$TMP_DIR"
    fi
}
trap cleanup EXIT

echo "This script is meant to be executed in a directory right after using create-svelte with the following options : skeleton project, Typescript syntax, no additional option."
echo "It will download content from $GITHUB_URL and copy it into the current folder."
echo "The following packages will be installed : $RUN_PACKAGES $DEV_PACKAGES"
echo ".gitignore and svelte.config.js will be modified."
echo "src/routes/+page.svelte will be deleted."
echo -n "Do you agree to continue? (y/n): "
read -r answer < /dev/tty
if [[ $answer =~ ^[Nn]$ ]]; then
    exit 1
fi

echo
echo "Cloning repository"
TMP_DIR=$(mktemp -d)
if ! git clone "$GITHUB_URL" "$TMP_DIR"; then
    echo "Failed to clone repository. Please check your internet connection and the repository URL."
    exit 1
fi

echo "Copying files"
cp -r "$TMP_DIR/files/." ./ || { echo "Failed to copy files."; exit 1; }

if [ -f "src/routes/+page.svelte" ]; then
    rm src/routes/+page.svelte
    echo "Removed src/routes/+page.svelte"
fi

echo "Adding package.json scripts"
jq --tab '.scripts += {"predev": "./prebuild.ts", "prebuild": "./prebuild.ts"}' package.json > package.json.tmp && mv package.json.tmp package.json

echo "Adding @sveltejs/adapter-static to svelte.config.js"
sed -i 's/@sveltejs\/adapter-auto/@sveltejs\/adapter-static/g' svelte.config.js

echo "Adding ./static/admin/decap-cms.js to .gitignore"
printf "\n# DecapCMS\n/static/admin/decap-cms.js" >> .gitignore

echo "Adding .env file"
printf "PUBLIC_GITHUB_USER=JohnDoe\nPUBLIC_GITHUB_REPO=myrepo\nPUBLIC_WEBSITE_URL=https://example.com\nPUBLIC_BACKEND_BRANCH=master" > .env

install_packages() {
    local cmd=$1
    echo "Installing packages using $cmd"
    $cmd add $RUN_PACKAGES || { echo "Failed to install runtime packages."; exit 1; }
    $cmd add -D $DEV_PACKAGES || { echo "Failed to install dev packages."; exit 1; }
}

if command -v bun > /dev/null; then
    install_packages "bun"
elif command -v pnpm > /dev/null; then
    install_packages "pnpm"
elif command -v yarn > /dev/null; then
    install_packages "yarn"
elif command -v npm > /dev/null; then
    install_packages "npm"
else
    echo "No supported package manager (bun, pnpm, yarn, npm) found. Please install one and try again."
    exit 1
fi

echo
echo "Setup completed successfully !"
