#!/bin/bash

# Check if the folder to be copied is provided as an argument
if [ -z "$1" ]; then
  echo "Usage: $0 /path/to/local/folder"
  exit 1
fi

# Define the folder to be copied and the volume name
FOLDER_TO_COPY=$1
VOLUME_NAME="cioos-metadata-form-files"

# if the volume exists remove its content
if docker volume inspect ${VOLUME_NAME} &> /dev/null; then
  echo "Volume ${VOLUME_NAME} exists. Removing its content..."
  docker run --rm -v ${VOLUME_NAME}:/data busybox rm -rf /data/*
fi

# Create a temporary container with the volume mounted
TEMP_CONTAINER=$(docker run -d -v ${VOLUME_NAME}:/data busybox sleep 3600)

# Copy the folder to the volume
docker cp ${FOLDER_TO_COPY} ${TEMP_CONTAINER}:/data

# Stop and remove the temporary container
docker rm -f ${TEMP_CONTAINER}

echo "Folder ${FOLDER_TO_COPY} has been copied to the Docker volume ${VOLUME_NAME}."