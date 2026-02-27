#!/usr/bin/env python3
import time
import requests
import datetime
import sys

API_KEY = "sk-83e2e2edb6704dfb85eaebc92dcb47b9"
URL = "https://api.deepseek.com/models"
HEADERS = {"Authorization": f"Bearer {API_KEY}"}

print(f"Starting monitor for DeepSeek V4 at {datetime.datetime.now()}...")
print("Press Ctrl+C to stop\n")

try:
    while True:
        try:
            timestamp = datetime.datetime.now().strftime("%H:%M:%S")
            response = requests.get(URL, headers=HEADERS, timeout=5)
            
            if response.status_code == 200:
                models = [m['id'] for m in response.json().get('data', [])]
                v4_found = any('v4' in m_id.lower() for m_id in models)
                
                if v4_found:
                    print(f"[{timestamp}] 🚨 ALERT: DeepSeek V4 IS LIVE! Models: {models}", flush=True)
                    sys.exit(0)
                else:
                    print(f"[{timestamp}] Check clear. V4 not found. (Scanned {len(models)} models)", flush=True)
            else:
                print(f"[{timestamp}] Error: API returned {response.status_code}", flush=True)
                
        except Exception as e:
            print(f"[{timestamp}] Connection error: {e}", flush=True)

        time.sleep(600)

except KeyboardInterrupt:
    print("\nMonitor stopped.")