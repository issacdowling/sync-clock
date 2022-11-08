import requests
import time
import asyncio
import websockets

timerWanted = False

if input("Do you want to get the timer? [Y/n]") != "n":
    timer = requests.get("http://localhost:5000/timer").json()
    if timer["running"] == True:
        while True:
            timer = requests.get("http://localhost:5000/timer").json()
            if timer["running"] == False:
                if timer["dismissed"] == False:
                    print("Timer done")
                else:
                    exit("Dismissed")
            print(timer["seconds"])
            time.sleep(1)
    else:
        print("Well, there's no timer running.")
        exit()
else:
    asyncio.run(listen())
