import sys
import os
import time
import json

stop_timer_filepath = "stop_timer"
timerLeftPath = "timer_file.json"

# Will be relevant for when you can request minutes and seconds
if len(sys.argv) != 3:
    if len(sys.argv) !=5:
        print("Invalid # of arguments")

#Check if there's already a timer running, and exit if so
if os.path.exists(timerLeftPath):
    with open(timerLeftPath, "r") as timerLeft:
        if json.load(timerLeft)["running"] == True:
            print("There's already a timer running")
            exit()

#Remove latent stop_timer file if relevant
if os.path.exists(stop_timer_filepath):
    os.remove(stop_timer_filepath)

number = int(sys.argv[1])
unit = str(sys.argv[2])

if unit == "sec":
    timerLength = number-1
elif unit == "min":
    timerLength = (number*60)-1

original_timerLength = timerLength
timerstats = {"seconds" : timerLength, "starting_seconds" : original_timerLength+1, "running" : True, "dismissed" : False}

#Main loop for timing
while timerLength:
    #Count the seconds
    time.sleep(1)
    timerLength -=1
    timerstats["seconds"] = timerLength

    #Write to file with timer stats
    with open(timerLeftPath, "w") as timerLeft:
        timerLeft.write(json.dumps(timerstats))

    #Check if timer should be cancelled
    if os.path.exists(stop_timer_filepath):
        #Cancel timer
        print("Timer cancelled")
        timerstats["running"] = False
        timerstats["dismissed"] = True
        with open(timerLeftPath, "w") as timerLeft:
            timerLeft.write(json.dumps(timerstats))
        break

timerstats["running"] = False

#Write changes to signify the fact that the timer is done
with open(timerLeftPath, "w") as timerLeft:
    timerLeft.write(json.dumps(timerstats))

#Code to be run while timer finished but user hasn't dismissed it.
while timerstats["dismissed"] == False:
    if os.path.exists(stop_timer_filepath):
        print("Timer dismissed")
        timerstats["dismissed"] = True
        with open(timerLeftPath, "w") as timerLeft:
            timerLeft.write(json.dumps(timerstats))
        exit()
    else:
        print("Timer done")
        
if os.path.exists(stop_timer_filepath):
    os.remove(stop_timer_filepath)
