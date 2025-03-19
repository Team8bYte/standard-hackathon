import pyaudio
import wave
import threading

class AudioRecorder:
    def __init__(self, output_file, channels=1, rate=16000, chunk=1024):
        self.output_file = output_file
        self.channels = channels
        self.rate = rate
        self.chunk = chunk
        self.format = pyaudio.paInt16
        self.recording = False
        self.thread = None
        self.frames = []
    
    def start_recording(self):
        self.recording = True
        self.frames = []
        self.thread = threading.Thread(target=self._record)
        self.thread.start()
    
    def stop_recording(self):
        self.recording = False
        if self.thread:
            self.thread.join()
            self._save_audio()
    
    def _record(self):
        # Initialize PyAudio
        p = pyaudio.PyAudio()
        stream = p.open(format=self.format,
                        channels=self.channels,
                        rate=self.rate,
                        input=True,
                        frames_per_buffer=self.chunk)
        
        print("Recording audio...")
        
        while self.recording:
            data = stream.read(self.chunk)
            self.frames.append(data)
        
        # Stop and close the stream
        stream.stop_stream()
        stream.close()
        p.terminate()
        
        print("Audio recording stopped")
    
    def _save_audio(self):
        if not self.frames:
            print("No audio data to save")
            return
        
        # Save the audio to a WAV file
        with wave.open(self.output_file, "wb") as wf:
            wf.setnchannels(self.channels)
            wf.setsampwidth(pyaudio.PyAudio().get_sample_size(self.format))
            wf.setframerate(self.rate)
            wf.writeframes(b''.join(self.frames))
        
        print(f"Audio saved to '{self.output_file}'")
