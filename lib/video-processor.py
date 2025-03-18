import whisper
import json
import sys
import os
from moviepy.editor import VideoFileClip
import numpy as np
from typing import List, Dict, Any

def segment_video(video_path: str, output_dir: str) -> Dict[str, Any]:
    """
    Process a video file, transcribe it, and segment it based on topics.
    Returns the segments with their timestamps and transcriptions.
    """
    print(f"Processing video: {video_path}")
    
    # Load Whisper model
    model = whisper.load_model("base")
    print("Whisper model loaded")
    
    # Transcribe the entire video
    result = model.transcribe(video_path, language="en")
    print("Video transcribed")
    
    # Extract segments based on natural breaks in speech and topic changes
    segments = []
    current_segment = {
        "start": 0,
        "text": "",
        "questions": []
    }
    
    for segment in result["segments"]:
        # Check for topic changes or long pauses
        if len(current_segment["text"]) > 0 and (
            segment["start"] - (current_segment["start"] + len(current_segment["text"])) > 2.0  # 2-second pause
            or "?" in segment["text"]  # Question mark indicates potential new topic
        ):
            # Extract potential questions from the current segment
            questions = extract_questions(current_segment["text"])
            if questions:
                current_segment["questions"] = questions
            
            if len(current_segment["text"].strip()) > 0:
                segments.append(current_segment)
            
            current_segment = {
                "start": segment["start"],
                "text": segment["text"],
                "questions": []
            }
        else:
            current_segment["text"] += " " + segment["text"]
    
    # Add the last segment
    if current_segment["text"]:
        questions = extract_questions(current_segment["text"])
        if questions:
            current_segment["questions"] = questions
        segments.append(current_segment)
    
    # Create video clips for each segment
    video = VideoFileClip(video_path)
    
    processed_segments = []
    for i, segment in enumerate(segments):
        if i < len(segments) - 1:
            end_time = segments[i + 1]["start"]
        else:
            end_time = video.duration
        
        # Only process segments that have questions
        if segment["questions"]:
            segment_filename = f"segment_{i + 1}.mp4"
            segment_path = os.path.join(output_dir, segment_filename)
            
            # Extract segment video
            video_segment = video.subclip(segment["start"], end_time)
            video_segment.write_videofile(
                segment_path,
                codec="libx264",
                audio_codec="aac"
            )
            
            processed_segments.append({
                "id": i + 1,
                "filename": segment_filename,
                "start_time": segment["start"],
                "end_time": end_time,
                "transcript": segment["text"],
                "questions": segment["questions"]
            })
    
    video.close()
    
    return {
        "original_video": os.path.basename(video_path),
        "segments": processed_segments
    }

def extract_questions(text: str) -> List[str]:
    """
    Extract potential questions from the text based on loan management topics.
    """
    # Split text into sentences
    sentences = text.split(".")
    questions = []
    
    # Keywords related to loan management
    keywords = [
        "loan", "application", "process", "verify", "document",
        "risk", "credit", "assessment", "approval", "identity",
        "financial", "collateral", "income", "debt", "requirements"
    ]
    
    for sentence in sentences:
        sentence = sentence.strip()
        # Check if the sentence contains relevant keywords
        if any(keyword in sentence.lower() for keyword in keywords):
            # Convert statements into questions
            if not sentence.endswith("?"):
                # Remove common question starters if they exist
                for starter in ["What is", "How do", "Why is", "Can you"]:
                    if sentence.startswith(starter):
                        sentence = sentence[len(starter):].strip()
                
                # Convert to question format
                if sentence.lower().startswith("the "):
                    sentence = sentence[4:]
                elif sentence.lower().startswith("a "):
                    sentence = sentence[2:]
                
                # Add appropriate question starter based on content
                if "how" in sentence.lower() or "process" in sentence.lower():
                    question = f"How does {sentence}?"
                elif "why" in sentence.lower():
                    question = f"Why is {sentence}?"
                else:
                    question = f"What is {sentence}?"
                
                questions.append(question)
            else:
                questions.append(sentence)
    
    return questions

def main():
    if len(sys.argv) != 3:
        print("Usage: python video-processor.py <video_path> <output_dir>")
        sys.exit(1)
    
    video_path = sys.argv[1]
    output_dir = sys.argv[2]
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    try:
        result = segment_video(video_path, output_dir)
        
        # Save metadata
        metadata_path = os.path.join(output_dir, "metadata.json")
        with open(metadata_path, "w") as f:
            json.dump(result, f, indent=2)
        
        print(f"Processing complete. Results saved to {metadata_path}")
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(f"Error processing video: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main() 