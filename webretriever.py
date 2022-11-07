import requests
import time

while True:
    timersecs = requests.get("http://localhost:5000/timer")
    print(timersecs.json()["seconds"])
    time.sleep(1)
