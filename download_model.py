#!/usr/bin/env python3
"""
Download DeepSeek-V3.2 GGUF model with resume capability.
Optimized for RTX 5090 - downloading Q4_K_M quant.
"""

import os
import sys
from huggingface_hub import hf_hub_download, list_repo_files
from pathlib import Path

# Configuration
REPO_ID = "unsloth/DeepSeek-V3.2-GGUF"
QUANT = "Q4_K_M"  # Safe for RTX 5090 32GB
LOCAL_DIR = Path(r"C:\Users\ieatexp\Desktop\LLMS\DeepSeek-V3.2-Q4_K_M")

def download_model():
    """Download GGUF model files with progress tracking."""
    print(f"Downloading {REPO_ID} ({QUANT})...")
    print(f"Target directory: {LOCAL_DIR}")
    print("=" * 60)
    
    # Ensure directory exists
    LOCAL_DIR.mkdir(parents=True, exist_ok=True)
    
    # Get list of files for this quant
    try:
        all_files = list_repo_files(REPO_ID)
        target_files = [f for f in all_files if f.startswith(f"{QUANT}/") and f.endswith(".gguf")]
        
        print(f"Found {len(target_files)} files to download:")
        for f in target_files:
            print(f"  - {f}")
        print("=" * 60)
        
        # Download each file
        for i, filename in enumerate(target_files, 1):
            print(f"\n[{i}/{len(target_files)}] Downloading: {filename}")
            try:
                downloaded_path = hf_hub_download(
                    repo_id=REPO_ID,
                    filename=filename,
                    local_dir=str(LOCAL_DIR),
                    local_dir_use_symlinks=False,
                    resume_download=True
                )
                print(f"  ✓ Saved to: {downloaded_path}")
            except Exception as e:
                print(f"  ✗ Error downloading {filename}: {e}")
                sys.exit(1)
        
        print("\n" + "=" * 60)
        print("Download complete!")
        print(f"Files saved to: {LOCAL_DIR}")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    download_model()