#!/bin/bash

# Color codes for better output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Downloading face-api.js model files =====${NC}\n"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Python is installed
if ! command_exists python3; then
    echo "Python 3 is required but not installed. Please install Python 3 and try again."
    exit 1
fi

# Check if pip is installed
if ! command_exists pip3; then
    echo "pip3 is required but not installed. Please install pip3 and try again."
    exit 1
fi

# Check if ffmpeg is installed
if ! command_exists ffmpeg; then
    echo "ffmpeg is required but not installed."
    echo "Please install ffmpeg using your package manager:"
    echo "  - For macOS: brew install ffmpeg"
    echo "  - For Ubuntu/Debian: sudo apt-get install ffmpeg"
    echo "  - For Windows: Download from https://ffmpeg.org/download.html"
    exit 1
fi

# Create models directory if it doesn't exist
mkdir -p models

# Install Whisper
echo "Installing Whisper..."
pip3 install git+https://github.com/openai/whisper.git

# Download face-api.js models
echo "Downloading face-api.js models..."
cd models

# List of models to download
models=(
    "face_landmark_68_model-weights_manifest.json"
    "face_landmark_68_model-shard1"
    "face_recognition_model-weights_manifest.json"
    "face_recognition_model-shard1"
    "face_recognition_model-shard2"
    "tiny_face_detector_model-weights_manifest.json"
    "tiny_face_detector_model-shard1"
)

base_url="https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

# Download each model
for model in "${models[@]}"; do
    if [ ! -f "$model" ]; then
        echo "Downloading $model..."
        curl -O "$base_url/$model"
    else
        echo "$model already exists, skipping..."
    fi
done

echo "Setup complete!"

# Return to the original directory
cd ../../

echo -e "\n${BLUE}You can now start the application with:${NC}"
echo -e "${GREEN}npm run dev${NC}"
echo -e "Or with HTTPS (recommended):"
echo -e "${GREEN}npm run dev:https${NC}"

exit 0 