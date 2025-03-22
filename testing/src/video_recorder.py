import cv2
import threading
import time
from datetime import datetime

class VideoRecorder:
    def __init__(self, output_file):
        self.output_file = output_file
        self.recording = False
        self.thread = None
    
    @staticmethod
    def get_timestamp():
        return datetime.now().strftime("%Y%m%d_%H%M%S")
    
    def start_recording(self):
        self.recording = True
    
    def stop_recording(self):
        self.recording = False
        if self.thread:
            self.thread.join()
    
    def record(self):
        # Initialize video capture
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("Error: Could not open video device.")
            return
        
        # Get video properties
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = 30
        
        # Video writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(self.output_file, fourcc, fps, (width, height))
        
        start_time = time.time()
        frame_count = 0
        
        while self.recording:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Add recording indicator
            cv2.putText(frame, "Recording...", (30, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            
            # Display elapsed time
            elapsed_time = time.time() - start_time
            cv2.putText(frame, f"Time: {int(elapsed_time)}s", (30, 70), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            
            # Write to video file
            out.write(frame)
            
            # Display the resulting frame
            cv2.imshow('Video Recording', frame)
            
            # Calculate actual FPS
            frame_count += 1
            
            # Press 'q' to stop recording
            if cv2.waitKey(1) & 0xFF == ord('q'):
                self.recording = False
        
        # Release everything when done
        cap.release()
        out.release()
        cv2.destroyAllWindows()
        
        actual_fps = frame_count / elapsed_time if elapsed_time > 0 else 0
        print(f"Video saved to '{self.output_file}' (Actual FPS: {actual_fps:.2f})")
