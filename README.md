# Selfhosted-Synced-Stuff

## Description
This will be used for any little convenience features that I want to sync between devices. Timers are the easiest example: I set a timer on my phone, I want it on my PC.

# Usage

## Timers
Time things.

### Websockets

The address is `ws://your-ip:4761/timer`.

#### If you want to start a timer:
Send a JSON string to the websocket with the following format:
```
{"length" : length_in_seconds, "source" : device_name}
```

#### If you want to get the status of the timer:
Just stay connected to the websocket. You'll receive some JSON immediately on connection, and recieve more every time the status updates in any way:
```
{"remaining_length" : remaining_time_in_seconds, "starting_length" : original_timer_length_in_seconds, "dismissed" : user_has_dismissed_timer_bool, "source" : name_of_device_set_from}
```

#### If you want to stop the timer:
Send a JSON string to the websocket with the following format:
```
{"stop" : "please"}
```
If you don't ask nicely ("please"), I will be sorely disappointed (though technically you can put anything there).

## Roadmap
TBD

## Contributing
I welcome ideas or development. Do feel free to talk to me via [PREFERRABLY Matrix](https://matrix.to/#/#issac-dowling:matrix.org) but also [discord is an option](https://discord.com/invite/rmQX5984g8). I don't have specific rules, but before you spend tons of time on something, maybe just ask if it's within the scope of the project. When you contribute, please note that the license may change, and you agree that your code is alright to be brought over to any of the typical "FOSS-Style" licenses. I make the promise to keep this fully open-source and under a typical FOSS software license, and also to ask people's opinions before moving anything, but I don't want to be stuck with one license incase benefits of another pop up. For now - and right now I see no reason to change - the MPL seems good.
