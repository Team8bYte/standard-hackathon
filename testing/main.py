import os
import torch
from src.video_recorder import VideoRecorder
from src.audio_recorder import AudioRecorder
from src.media_processor import MediaProcessor
from src.transcriber import Transcriber
from src.utils import setup_directories

def main():
    # Check GPU availability
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")

    if device == "cuda":
        print(f"Number of GPU: {torch.cuda.device_count()}")
        print(f"GPU Name: {torch.cuda.get_device_name(0)}")

    # Setup output directories
    output_dirs = setup_directories()
    
    # File paths
    timestamp = VideoRecorder.get_timestamp()
    video_path = os.path.join(output_dirs['videos'], f"video_{timestamp}.mp4")
    audio_path = os.path.join(output_dirs['audio'], f"audio_{timestamp}.wav")
    output_path = os.path.join(output_dirs['videos'], f"final_{timestamp}.mp4")
    transcript_path = os.path.join(output_dirs['transcripts'], f"transcript_{timestamp}.txt")
    
    # Initialize components
    video_recorder = VideoRecorder(video_path)
    audio_recorder = AudioRecorder(audio_path)
    media_processor = MediaProcessor()
    transcriber = Transcriber(device=device)
    
    print("Starting recording session...")
    print("Press 'q' in the video window to stop recording")
    
    # Start recording
    video_recorder.start_recording()
    audio_recorder.start_recording()
    
    # Wait for video recording to complete (this will block until user presses 'q')
    video_recorder.record()
    
    # Stop audio recording
    audio_recorder.stop_recording()
    
    print("Recording completed. Processing media...")
    
    # Combine video and audio
    media_processor.combine_video_audio(video_path, audio_path, output_path)
    
    print("Transcribing audio...")
    
    # Transcribe audio
    transcript = transcriber.transcribe(audio_path)
    
    # Save transcript
    with open(transcript_path, "w", encoding="utf-8") as f:
        f.write(transcript)
    
    print("\nProcess completed successfully!")
    print(f"Final video: {output_path}")
    print(f"Transcript: {transcript_path}")
    
    # Print transcript preview
    print("\nTranscript preview:")
    preview_length = min(200, len(transcript))
    print(f"{transcript[:preview_length]}{'...' if len(transcript) > preview_length else ''}")

if __name__ == "__main__":
    main()
