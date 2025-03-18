import whisper
import sys
import json
import os
import logging
from typing import Dict, Any
import traceback

# Set up logging with more detailed format
logging.basicConfig(
    level=logging.DEBUG,  # Changed to DEBUG level
    format='%(asctime)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger(__name__)

def check_file(video_path: str) -> None:
    """Check if the video file exists and is accessible."""
    logger.debug(f"Checking file: {video_path}")
    
    if not os.path.exists(video_path):
        logger.error(f"File not found: {video_path}")
        raise FileNotFoundError(f"Video file not found: {video_path}")
    
    if not os.path.isfile(video_path):
        logger.error(f"Not a file: {video_path}")
        raise ValueError(f"Path is not a file: {video_path}")
    
    if not os.access(video_path, os.R_OK):
        logger.error(f"No read permission: {video_path}")
        raise PermissionError(f"No read permission for file: {video_path}")
    
    file_size = os.path.getsize(video_path)
    logger.info(f"File validation successful - Size: {file_size / (1024*1024):.2f} MB, Path: {video_path}")

def transcribe_video(video_path: str) -> Dict[str, Any]:
    """Transcribe a video file using Whisper."""
    try:
        logger.debug("Starting transcription process")
        
        # Check the video file
        check_file(video_path)
        
        logger.info("Loading Whisper model...")
        try:
            # Load the Whisper model with debug info
            model = whisper.load_model("base")
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
        
        logger.info(f"Starting transcription for: {video_path}")
        try:
            # Transcribe the video with more options and debug info
            result = model.transcribe(
                video_path,
                language="en",
                task="transcribe",
                verbose=False  # Changed to False to reduce stdout noise
            )
            logger.info("Raw transcription result obtained")
        except Exception as e:
            logger.error(f"Transcription failed: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
        
        # Validate the result
        if not isinstance(result, dict) or 'text' not in result:
            logger.error(f"Invalid transcription result format: {result}")
            raise ValueError("Transcription result is not in expected format")
        
        # Extract just the text and metadata we need
        response = {
            "success": True,
            "text": result["text"].strip(),
            "metadata": {
                "text_length": len(result["text"]),
                "word_count": len(result["text"].split()),
                "language": result.get("language", "en"),
                "duration": result.get("duration", 0)
            }
        }
        
        logger.info(f"Transcription completed successfully: {json.dumps(response['metadata'])}")
        return response
        
    except Exception as e:
        error_details = {
            "error_type": type(e).__name__,
            "error_message": str(e),
            "traceback": traceback.format_exc()
        }
        logger.error(f"Transcription failed with error: {json.dumps(error_details)}")
        return {
            "success": False,
            "error": str(e),
            "error_details": error_details
        }

if __name__ == "__main__":
    try:
        logger.info("Script started")
        if len(sys.argv) != 2:
            logger.error("Invalid number of arguments")
            result = {
                "success": False,
                "error": "Please provide a video file path"
            }
        else:
            video_path = sys.argv[1]
            logger.info(f"Processing video: {video_path}")
            result = transcribe_video(video_path)
        
        # Only output the JSON result to stdout
        print(json.dumps(result))
    except Exception as e:
        logger.error(f"Unhandled exception: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        print(json.dumps({
            "success": False,
            "error": f"Unhandled error: {str(e)}",
            "traceback": traceback.format_exc()
        })) 