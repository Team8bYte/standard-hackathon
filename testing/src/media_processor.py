import moviepy.editor as mp

class MediaProcessor:
    def __init__(self):
        pass
    
    def combine_video_audio(self, video_path, audio_path, output_path):
        """
        Combines video and audio files into a single video file
        """
        print("Combining video and audio...")
        
        # Load the video file
        video = mp.VideoFileClip(video_path)
        
        # Load the audio file
        audio = mp.AudioFileClip(audio_path)
        
        # Set the audio of the video file
        final_video = video.set_audio(audio)
        
        # Write the result to a file
        final_video.write_videofile(output_path, codec='libx264', audio_codec='aac')
        
        print(f"Final video with audio saved to '{output_path}'")
