import subprocess
import signal

#Run this when app killed from terminal
def kill_processes(s,f):
    #Ends all background timer syncing processes related to the app
    subprocess.run("kill $(pgrep -f 'timer-sync-linux-app.py')", shell=True)

#When app killed, run the function kill_processes
signal.signal(signal.SIGALRM, kill_processes)
signal.signal(signal.SIGHUP,  kill_processes)
signal.signal(signal.SIGINT,  kill_processes)
signal.signal(signal.SIGTERM, kill_processes)

#Run the GUI and timer sync scripts
subprocess.run("python3 timer-sync-linux-app.py & python3 timer-gui.py", shell=True)

