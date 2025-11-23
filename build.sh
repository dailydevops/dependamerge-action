#!/bin/bash
set -e

echo "Building DependaMerge .NET Action..."

# Clean previous build
rm -rf dist-dotnet

# Build and publish
cd src-dotnet/DependaMerge.Action
dotnet publish -c Release -o ../../dist-dotnet

echo "Build completed successfully!"
echo "Output: dist-dotnet/DependaMerge.Action"
