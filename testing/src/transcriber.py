from faster_whisper import WhisperModel

class Transcriber:
    def __init__(self, model_size="base", device="cuda", compute_type="float16"):
        self.model_size = model_size
        self.device = device
        self.compute_type = compute_type
        self.model = None
        
        # Initialize the model
        self._load_model()
    
    def _load_model(self):
        print(f"Loading Whisper model ({self.model_size}) on {self.device}...")
        self.model = WhisperModel(
            self.model_size, 
            device=self.device, 
            compute_type=self.compute_type
        )
    
    def transcribe(self, audio_path):
        """
        Transcribe audio file to text
        """
        if not self.model:
            self._load_model()
        
        print(f"Transcribing audio file: {audio_path}")
        
        # Transcribe the audio
        segments, info = self.model.transcribe(audio_path, beam_size=5)
        
        # Process the transcription
        transcript = ""
        for segment in segments:
            transcript += segment.text + " "
        
        print(f"Transcription completed ({len(transcript)} characters)")
        
        return transcript
