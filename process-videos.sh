#!/bin/bash

# Install required Python packages
pip3 install moviepy

# Create output directories
mkdir -p public/videos/segments

# Process both videos
echo "Processing first video..."
python3 lib/video-processor.py videos/WhatsApp\ Video\ 2025-03-18\ at\ 19.01.03.mp4 public/videos/segments/video1

echo "Processing second video..."
python3 lib/video-processor.py videos/WhatsApp\ Video\ 2025-03-18\ at\ 19.02.41.mp4 public/videos/segments/video2

# Make the script executable
chmod +x process-videos.sh 