#!/bin/bash

# Create all necessary directories for the RAWGLE frontend

dirs=(
  "src/components"
  "src/components/ui"
  "src/components/layout"
  "src/components/dashboard"
  "src/components/pets"
  "src/components/feeding"
  "src/components/health"
  "src/components/community"
  "src/components/shop"
  "src/components/paws"
  "src/lib"
  "src/hooks"
  "src/styles"
  "src/types"
  "src/data"
  "src/store"
  "src/utils"
  "src/app/api"
  "src/app/(public)"
  "src/app/(auth)"
  "src/app/(dashboard)"
  "public"
  "public/images"
  "public/icons"
)

for dir in "${dirs[@]}"; do
  mkdir -p "$dir"
done

echo "Directory structure created successfully!"
