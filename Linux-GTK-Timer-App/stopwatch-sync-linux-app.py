##KNOWN HUGE BUG, WHEN WEBSOCKET DISCONNECTS AFTER BEING CONNECTED, RUNAWAY CPU USAGE

import asyncio
import websockets
import json
from time import sleep
from subprocess import call
import os

webserver_url = 'ws://10.0.0.20:4761/stopwatch'
working_dir = "/tmp/issacdowling-timers/"
stopwatch_info_file = working_dir + "stopwatch_sync_info.json"
stopwatch_clear_file = working_dir + "stopwatch_clear"
stopwatch_start_file = working_dir + "stopwatch_start"
stopwatch_pause_file = working_dir + "stopwatch_pause"

if not os.path.exists("/tmp/issacdowling-timers/"):
    os.makedirs("/tmp/issacdowling-timers/")

if os.path.exists("/tmp/issacdowling-timers/timer_sync_info.json"):
    os.remove("/tmp/issacdowling-timers/timer_sync_info.json")

source = "Linux PC"

async def get_timer_info():
    async with websockets.connect(webserver_url) as websocket:
        #Blank timer stats initialise at start
        stopwatch = {"seconds" : 0, "source" : " ","paused" : False}

        #Constantly running loop, do everything within all of the time
        while True:

            #If clear file exists, send websocket message to clear the stopwatch and delete the file
            if os.path.exists(stopwatch_clear_file):
                os.remove(stopwatch_clear_file)
                await websocket.send(json.dumps({"clear" : "please"}))

            #If pause file exists, send websocket message to pause the stopwatch and delete the file
            if os.path.exists(stopwatch_pause_file):
                os.remove(stopwatch_pause_file)
                await websocket.send(json.dumps({"pause" : "please"}))

            #If start file exists, send websocket message with the info from the start file
            if os.path.exists(stopwatch_start_file):
                start_info = json.load(open(stopwatch_start_file, 'r'))
                os.remove(stopwatch_start_file)
                start_info_dict = {"source" : source}
                await websocket.send(json.dumps(start_info_dict))

            #Store the state of the previous message, but don't fail if no message came through on this loop
            try:
                #Wait for a message from websocket for a second, timeout WITHOUT FAILING otherwise
                stopwatch = json.loads(await asyncio.wait_for(websocket.recv(), 2))
            except:
                pass
            
            #Save timer info to external file
            with open(stopwatch_info_file, 'w') as stopwatch_file:
                stopwatch_file.write(json.dumps(stopwatch))

# This allows the script to reconnect if the websocket is not open. Tries every 2 seconds if not open.
while True:
    try:
        asyncio.run(get_timer_info())
    except OSError:
        sleep(2)