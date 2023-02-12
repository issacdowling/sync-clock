import sys
import os
import time
import json

#When testing, make it somewhere other than the repo, or five server will auto refresh, breaking things
working_dir = ""
pause_stopwatch_path = working_dir + "pause_stopwatch"
clear_stopwatch_path = working_dir + "clear_stopwatch"
start_stopwatch_path = working_dir + "start_stopwatch"
stopwatch_progress_path = working_dir + "stopwatch_file.json"

while True:

    #Check if there are any residual files from a previous run.
    #This script should never be run multiple times on the same path.
    if os.path.exists(stopwatch_progress_path):
        os.remove(stopwatch_progress_path)
    if os.path.exists(start_stopwatch_path):
        os.remove(start_stopwatch_path)
    if os.path.exists(clear_stopwatch_path):
        os.remove(clear_stopwatch_path)
    if os.path.exists(pause_stopwatch_path):
        os.remove(pause_stopwatch_path)

    #Make empty timer file
    blank_stopstats = {"seconds" : 0, "source" : " ", "paused" : False}
    with open(stopwatch_progress_path, 'w') as stopwatch_progress:
        stopwatch_progress.write(json.dumps(blank_stopstats))

    #Don't continue until timer should be started (start_timer exists)
    while not os.path.exists(start_stopwatch_path):
        time.sleep(0.1)
        pass
    
    #Give time for JSON file to be fully created (otherwise read error may happen)
    time.sleep(0.1)
    
    #Read timer info from start file, save as dict
    stopwatch_json = json.load(open(start_stopwatch_path, 'r'))

    try:
        stopstats = {"seconds" : 0, "source" : stopwatch_json["source"], "paused" : False}
    # If we can't parse it, make the source blank.
    except:
        stopstats = {"seconds" : 0, "source" : "unknown", "paused" : False}
    
    #Main loop for timing (final run when seconds at 1, since it'll then take 1 away to get 0)
    while True:
        #Count the seconds
        time.sleep(1)
        stopstats["seconds"] += 1
    
        #Write to file with timer stats
        with open(stopwatch_progress_path, "w") as stopwatch_progress:
            stopwatch_progress.write(json.dumps(stopstats))

        #Check if stopwatch should be paused
        if os.path.exists(pause_stopwatch_path):
            stopstats["paused"] = True
            print("stopwatch paused")
            #If so, just delete the file, and unpause once the file comes back, or the clear file comes
            os.remove(pause_stopwatch_path)
            while True:
                #For pause file
                if os.path.exists(pause_stopwatch_path):
                    stopstats["paused"] = False
                    print("stopwatch unpaused")
                    os.remove(pause_stopwatch_path)
                    break
                #For clear file
                if os.path.exists(clear_stopwatch_path):
                    stopstats["paused"] = False
                    break
                time.sleep(0.1)
    
        #Check if timer should be cancelled
        if os.path.exists(clear_stopwatch_path):
            #Cancel timer by setting the remaining length to 0 and dismissing it
            print("stopwatch cleared")
            stopstats["seconds"] = 0
            with open(stopwatch_progress_path, "w") as stopwatch_progress:
                stopwatch_progress.write(json.dumps(stopstats))
            break

    #Allow time before deleting the files
    time.sleep(0.5)