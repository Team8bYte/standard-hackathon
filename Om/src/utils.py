import os

def setup_directories():
    """
    Creates necessary directories for output files
    """
    base_dir = "output"
    dirs = {
        'videos': os.path.join(base_dir, 'videos'),
        'audio': os.path.join(base_dir, 'audio'),
        'transcripts': os.path.join(base_dir, 'transcripts')
    }
    
    for dir_path in dirs.values():
        os.makedirs(dir_path, exist_ok=True)
    
    return dirs
