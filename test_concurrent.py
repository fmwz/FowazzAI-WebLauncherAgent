"""
Test script to verify Fowazz can handle concurrent users
"""
import requests
import threading
import time
import json

SERVER_URL = "http://127.0.0.1:5000"

def test_user(user_id, message):
    """Simulate a user sending a message to Fowazz"""
    print(f"[User {user_id}] Starting request: {message[:50]}...")
    start_time = time.time()

    try:
        response = requests.post(
            f"{SERVER_URL}/api/message",
            json={
                "messages": [
                    {"role": "user", "content": message}
                ]
            },
            stream=True,
            timeout=60
        )

        chunks_received = 0
        for line in response.iter_lines():
            if line:
                line = line.decode('utf-8')
                if line.startswith('data: '):
                    chunks_received += 1
                    data = json.loads(line[6:])
                    if data.get('done'):
                        elapsed = time.time() - start_time
                        print(f"[User {user_id}] ✅ COMPLETED in {elapsed:.2f}s - Received {chunks_received} chunks")
                        return True

    except Exception as e:
        elapsed = time.time() - start_time
        print(f"[User {user_id}] ❌ ERROR after {elapsed:.2f}s: {str(e)}")
        return False

def test_concurrent_users():
    """Test multiple users at the same time"""
    print("\n" + "="*60)
    print("CONCURRENT USER TEST")
    print("="*60)
    print("\nTesting if 2 users can talk to Fowazz simultaneously...\n")

    # Two different users with different requests
    user1_message = "Build me a simple portfolio website with a hero section"
    user2_message = "Create a landing page for a coffee shop with a menu"

    # Start both requests at the same time
    thread1 = threading.Thread(target=test_user, args=(1, user1_message))
    thread2 = threading.Thread(target=test_user, args=(2, user2_message))

    start_time = time.time()

    thread1.start()
    time.sleep(0.1)  # Slight delay to ensure overlap
    thread2.start()

    thread1.join()
    thread2.join()

    total_time = time.time() - start_time

    print("\n" + "="*60)
    print(f"Total test time: {total_time:.2f}s")
    print("\nIf both users completed successfully and total time is")
    print("similar to a single request (not 2x), then concurrent")
    print("streaming is working properly!")
    print("="*60 + "\n")

if __name__ == "__main__":
    # Check if server is running
    try:
        response = requests.get(f"{SERVER_URL}/", timeout=2)
        print("✓ Server is running")
    except:
        print("❌ Server is NOT running! Start it first with: python server.py")
        exit(1)

    test_concurrent_users()
