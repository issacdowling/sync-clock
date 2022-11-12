# Selfhosted-Synced-Stuff

## Description
This will be used for any little convenience features that I want to sync between devices. Timers are the easiest example: I set a timer on my phone, I want it on my PC.

## Installation
For now, everything is just a python script. Clone the repo, and run webserver.py . Then, run whatever extra feature you want too. Right now it's just timers implemented, so you'll also run timer.py. You've now got a webserver allowing devices access to the timer, which can be accessed using the companion apps also available on this repo. If you don't see a way to configure the IP that the clients are accessing, it'll be a variable at the top of the client's script, which you should change to the local IP of the device running webserver.py. webserver.py and the individual featues (like timer.py) by default must stay in the same directory as eachother, however there's a working_dir variable that can be changed if you'd rather do it differently.

## Usage
TBD

## Roadmap
TBD

## Contributing
I welcome ideas or development. Do feel free to talk to me via [PREFERRABLY Matrix](https://matrix.to/#/#issac-dowling:matrix.org) but also [discord is an option](https://discord.com/invite/rmQX5984g8). I don't have specific rules, but before you spend tons of time on something, maybe just ask if it's within the scope of the project. When you contribute, please note that the license may change, and you agree that your code is alright to be brought over to any of the typical "FOSS-Style" licenses. I make the promise to keep this fully open-source and under a typical FOSS software license, and also to ask people's opinions before moving anything, but I don't want to be stuck with one license incase benefits of another pop up. For now - and right now I see no reason to change - the MPL seems good.
