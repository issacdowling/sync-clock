import sys
import os
import time
import json

stopTimerFilePath = "stopTimer"
timerLeftPath = "timer_file.json"

if len(sys.argv) != 3:
    if len(sys.argv) !=5:
        print("Invalid # of arguments")

if os.path.exists(stopTimerFilePath):
    os.remove(stopTimerFilePath)
if os.path.exists(timerLeftPath):
    print("There's already a timer running")
    exit()

number = int(sys.argv[1])
unit = str(sys.argv[2])


if unit == "sec":
    timerLength = number-1
elif unit == "min":
    timerLength = (number*60)-1

timerstats = {"seconds" : timerLength, "running" : True, "dismissed" : False}
while timerLength:
    time.sleep(1)
    timerLength -=1
    timerstats["seconds"] = timerLength
    timerLeft = open(timerLeftPath, "w")
    timerLeft.write(json.dumps(timerstats))
    if os.path.exists(stopTimerFilePath):
      print("Timer cancelled")
      break
while not os.path.exists(stopTimerFilePath):
    if os.path.exists(stopTimerFilePath):
        print("Timer stopped")
        break
    else:
        print("Timer done")
        
if os.path.exists(stopTimerFilePath):
    os.remove(stopTimerFilePath)
if os.path.exists(timerLeftPath):
    os.remove(timerLeftPath)
