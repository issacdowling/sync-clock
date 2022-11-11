import sys
import os
import time
import json

working_dir = ""
stop_timer_path = working_dir + "stop_timer"
start_timer_path = working_dir + "start_timer"
timer_left_path = working_dir + "timer_file.json"

while True:

    #Check if there's already a timer running, and exit if so
    if os.path.exists(timer_left_path):
        with open(timer_left_path, "r") as timer_left:
            if json.load(timer_left)["running"] == True:
                print("There's already a timer running")


    #Don't continue until timer should be started (start_timer exists)
    while not os.path.exists(start_timer_path):
        time.sleep(1)
        pass
    
    #Give time for JSON file to be fully created (otherwise read error may happen)
    time.sleep(0.1)
    
    #Read timer info from start file, save as dict
    timer_json = json.load(open(start_timer_path, 'r'))
    timerstats = {"length" : timer_json["length"]-1, "starting_length" : timer_json["length"], "running" : True, "dismissed" : False, "source" : timer_json["source"]}
    
    #Remove latent stop_timer file if relevant
    if os.path.exists(stop_timer_path):
        os.remove(stop_timer_path)
    
    #Main loop for timing
    while timerstats["length"]:
        #Count the seconds
        time.sleep(1)
        timerstats["length"] -= 1
    
        #Write to file with timer stats
        with open(timer_left_path, "w") as timer_left:
            timer_left.write(json.dumps(timerstats))
    
        #Check if timer should be cancelled
        if os.path.exists(stop_timer_path):
            #Cancel timer
            print("Timer cancelled")
            timerstats["running"] = False
            timerstats["dismissed"] = True
            with open(timer_left_path, "w") as timer_left:
                timer_left.write(json.dumps(timerstats))
            break
    
    timerstats["running"] = False
    
    #Write changes to signify the fact that the timer is done
    with open(timer_left_path, "w") as timer_left:
        timer_left.write(json.dumps(timerstats))
    
    #Code to be run while timer finished but user hasn't dismissed it.
    while timerstats["dismissed"] == False:
        if os.path.exists(stop_timer_path):
            print("Timer dismissed")
            timerstats["dismissed"] = True
            with open(timer_left_path, "w") as timer_left:
                timer_left.write(json.dumps(timerstats))
        else:
            print("Timer done")

    #Allow time before deleting the files
    time.sleep(0.5)
    
    if os.path.exists(stop_timer_path):
        os.remove(stop_timer_path)
    if os.path.exists(start_timer_path):
        os.remove(start_timer_path)

    
