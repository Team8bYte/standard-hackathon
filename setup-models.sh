#!/bin/bash

# Color codes for better output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Downloading face-api.js model files =====${NC}\n"

# Create models directory if it doesn't exist
if [ ! -d "./public/models" ]; then
    echo -e "Creating models directory..."
    mkdir -p ./public/models
fi

# Change to the models directory
cd ./public/models

# Base URL for face-api.js model weights
BASE_URL="https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

# Function to download a file with progress indicator
download_file() {
    local filename=$1
    echo -e "${YELLOW}Downloading ${filename}...${NC}"
    
    if command -v curl &> /dev/null; then
        curl -# -O "${BASE_URL}/${filename}"
    else
        wget --show-progress "${BASE_URL}/${filename}"
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Downloaded ${filename}${NC}"
    else
        echo -e "\nFailed to download ${filename}. Please check your internet connection and try again."
        exit 1
    fi
}

# Download SSD MobileNet model (face detection)
download_file "ssd_mobilenetv1_model-weights_manifest.json"
download_file "ssd_mobilenetv1_model-shard1"
download_file "ssd_mobilenetv1_model-shard2"

# Download Face Landmark model
download_file "face_landmark_68_model-weights_manifest.json"
download_file "face_landmark_68_model-shard1"

# Download Face Recognition model
download_file "face_recognition_model-weights_manifest.json"
download_file "face_recognition_model-shard1"
download_file "face_recognition_model-shard2"

echo -e "\n${GREEN}All model files have been downloaded successfully!${NC}"
echo -e "Model files are located in: ${YELLOW}./public/models/${NC}"

# Return to the original directory
cd ../../

echo -e "\n${BLUE}You can now start the application with:${NC}"
echo -e "${GREEN}npm run dev${NC}"
echo -e "Or with HTTPS (recommended):"
echo -e "${GREEN}npm run dev:https${NC}"

exit 0 