import sys
import os
import time
stopTimerFilePath = "stopTimer"
timerLeftPath = "timer"

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
while timerLength:
    time.sleep(1)
    timerLength -=1
    timerLeft = open(timerLeftPath, "w")
    timerLeft.write(str(timerLength))
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
