#!/bin/env python3
""" Core that communicates with the Timer-Sync daemon to provide networked timer sync for Bloob """
# load modules
import aiomqtt
import asyncio
import argparse
import signal
import paho, paho.mqtt, paho.mqtt.publish
import sys
import pathlib
import json
import subprocess
import mpv

# load the bloob module
bloob_python_module_dir = pathlib.Path(__file__).parents[2].joinpath("python_module")
sys.path.append(str(bloob_python_module_dir))

from bloob import getTextMatches, log

# setup the argparser
arg_parser = argparse.ArgumentParser()
arg_parser.add_argument("--host", default="localhost")
arg_parser.add_argument("--port", default=1883)
arg_parser.add_argument("--user")
arg_parser.add_argument("--pass", dest="password")
arg_parser.add_argument("--device-id")
arg_parser.add_argument("--identify", default="")

arguments = arg_parser.parse_args()
core_id = "timersync"
# identify handling
if arguments.identify:
    print(json.dumps({"id": core_id, "roles": ["intent_handler"]}))
    exit(0)

# define the core config
core_config = {
    "metadata": {
        "core_id": core_id,
        "friendly_name": "Timer sync daemon client",
        "link": "https://gitlab.com/issacdowling/sync-clock",
        "author": "ConfusionUnknown",
        "icon": None,
        "description": "Allows communication with the Timer-Sync daemon, providing networked timers for Blueberry",
        "version": "0.1",
        "license": "AGPLv3"
    },
    "intents": [
        {
            "intent_id": "setTimer",
            "core_id": core_id,
            "keywords": [ ["set", "make", "create"], ["timer", "time", "counter"], ["minutes", "minute", "seconds", "second", "hour", "hours"] ],
            "collections": [["any_number"]]
        },
        {
            "intent_id": "stopTimer",
            "core_id": core_id,
            "keywords": [ ["stop", "cancel", "dismiss"], ["timer"] ]
        },
        {
            "intent_id": "getTimer",
            "core_id": core_id,
            "keywords": [ ["timer", "time", "counter"], ["remaining", "left"] ],
            "collections": [["get"]]
        }
    ]
}

async def main():
    global daemon_proc, log_data, mpv_player
    # get logging working
    log_data = arguments.host, int(arguments.port), arguments.device_id, core_id
    log("Starting daemon", log_data)
    # start the daemon
    daemon_dir = pathlib.Path(sys.argv[0]).parent.joinpath("daemon")
    daemon = daemon_dir.joinpath("main.py")
    daemon_proc = subprocess.Popen([sys.executable, daemon], stdin=None, stdout=None, stderr=None)
    log("Daemon running", log_data)
    # get mpv ready
    mpv_player = mpv.MPV()
    # create sounding loop
    asyncio.create_task(sounder())
    async with aiomqtt.Client(hostname=arguments.host, port=int(arguments.port), username=arguments.user, password=arguments.password) as client:
        # sub to intent topic
        await client.subscribe(f"bloob/{arguments.device_id}/cores/{core_id}/run")
        # sub to timer topcis
        await client.subscribe("bloob/timers/finish")
        await client.subscribe("bloob/timers/dismissed")
        await client.subscribe("bloob/timers/status")

        # publish core config
        await client.publish(f"bloob/{arguments.device_id}/cores/{core_id}/config", payload=json.dumps(core_config), retain=True, qos=2)
        log("Core config published", log_data)
        # enter message handle loop
        async for message in client.messages:
            try:
                await handle_message(message, client)
            except Exception as e:
                log(f"Unable to parse message. ({e})", log_data)
sounding = False
timer_status = []
async def handle_message(message, client):
    global sounding, timer_status
    message_decoded = json.loads(message.payload.decode())

    if(message.topic.matches(f"bloob/{arguments.device_id}/cores/{core_id}/run")):
        match message_decoded["intent"]:
            case "setTimer":
                # find the amount of time
                amount_of_time_number = 0
                for word in message_decoded["text"].split(" "):
                    if word.isnumeric():
                        amount_of_time_number = int(word)
                        break
                # find the unit
                seconds = amount_of_time_number
                hours = ["hour", "hours"]
                minutes = ["minute", "minutes"]
                if(getTextMatches(match_item=hours, check_string=message_decoded["text"])):
                    seconds = seconds * 600
                if(getTextMatches(match_item=minutes, check_string=message_decoded["text"])):
                    seconds = seconds * 60
                log(f"Found time as {seconds} seconds.", log_data)

                # start the timer!
                await client.publish("bloob/timers/start", payload=json.dumps({
                    "length": seconds,
                    "source": {
                        "name": "Voice",
                        "uuid": arguments.device_id
                    }
                                                                               }))

                # respond to the intent
                spoken = "Sure thing"
                explanation = f"The timer core started a timer with length {seconds} seconds."
                await client.publish(f"bloob/{arguments.device_id}/cores/{core_id}/finished", payload=json.dumps({
                    "id": message_decoded["id"],
                    "text": spoken,
                    "explanation": explanation,
                    "end_type": "finish"
                }))
            case "stopTimer":
                await client.publish(f"bloob/timers/stop", payload=json.dumps({}))
                spoken = "Alright"
                explanation = f"The timer core stopped the timer that was going off."
                await client.publish(f"bloob/{arguments.device_id}/cores/{core_id}/finished", payload=json.dumps({
                    "id": message_decoded["id"],
                    "text": spoken,
                    "explanation": explanation,
                    "end_type": "finish"
                }))
            case "getTimer":

                if(len(timer_status) > 0):
                    # there is an active timer
                    # convert to nice human readable numbers
                    hours = 0
                    minutes = 0
                    seconds = int(timer_status[0]["length"])
                    spoken = "You have "
                    # get hours, if any
                    if(seconds >= 3600):
                        while seconds >= 3600:
                            seconds -= 3600
                            hours += 1

                        spoken += f"{hours} hours, "
                    # get minutes, if any
                    if(seconds >= 60):
                        while seconds >= 60:
                            seconds -= 60
                            minutes +=1
                        spoken += f"{minutes} minutes, "
                    # add seconds to string, if not zero
                    if(seconds >= 0):
                        spoken += f"{seconds} seconds"
                    spoken += " remaining on your timer"
                    explanation = f"The timer core checked for running timers, and the amount of time left on the timer was {hours} hours, {minutes} minutes, {seconds} seconds."
                else:
                    # no active timer
                    spoken = "You don't have any running timers right now."
                    explanation = "The timer core checked for running timers and there were no active timers."
                await client.publish(f"bloob/{arguments.device_id}/cores/{core_id}/finished", payload=json.dumps({
                        "id": message_decoded["id"],
                        "text": spoken,
                        "explanation": explanation,
                        "end_type": "finish"
                    }))
    if(message.topic.matches(f"bloob/timers/finish")):
        # play boop sound
        sounding = True
    if(message.topic.matches(f"bloob/timers/dismissed")):
        # stop sounding
        sounding = False
    if(message.topic.matches(f"bloob/timers/status")):
        timer_status = message_decoded

async def sounder():
    global mpv_player, sounding
    while True:
        if(sounding):
            log("Sounding", log_data)
            timer_sound = str(pathlib.Path(sys.argv[0]).parent.joinpath("timer.wav"))
            mpv_player.play(timer_sound)
        await asyncio.sleep(2)


if __name__ == "__main__":
    asyncio.run(main())
