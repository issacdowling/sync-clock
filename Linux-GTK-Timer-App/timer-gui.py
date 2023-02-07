import sys
import gi
import time
gi.require_version('Gtk', '4.0')
gi.require_version('Adw', '1')
from gi.repository import Gtk, Adw, GLib
import json
import signal
import subprocess

working_dir = "/tmp/issacdowling-timers/"
timer_info_file = working_dir + "timer_sync_info.json"
timer_stop_file = working_dir + "timer_stop"
timer_start_file = working_dir + "timer_start"

class MainWindow(Gtk.ApplicationWindow):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        #Once per second, refresh known info about the timer
        GLib.timeout_add(1000, self.refresh_stuff)

        #Basic window setup
        self.set_default_size(300, 250)
        self.set_title("Timers")

        #Create header with button
        self.header = Gtk.HeaderBar()
        self.set_titlebar(self.header)

        #Create boxes
        self.box_timer_main = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, halign=Gtk.Align.CENTER, valign=Gtk.Align.CENTER, spacing=20, margin_start=20, margin_end=20, margin_top=20, margin_bottom=20)
        self.box_timer_bar = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, homogeneous=True)
        self.box_timer_controls = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, homogeneous=True, spacing=10)

        #Create timer progress bar
        self.timer_progress_bar = Gtk.ProgressBar(show_text=True, halign=Gtk.Align.FILL)

        #Create timer control buttons
        self.button_stop_timer = Gtk.Button(label="Stop Timer", sensitive=False)
        self.button_stop_timer.connect('clicked', self.stop_timer)
        self.button_start_timer = Gtk.Button(label="Start Timer", sensitive=False)
        self.button_start_timer.connect('clicked', self.start_timer)

        #Create timer input field
        self.timer_input_field = Gtk.Text(placeholder_text="Input Length")

        #Place boxes
        self.set_child(self.box_timer_main)
        self.box_timer_main.append(self.box_timer_bar)
        self.box_timer_main.append(self.box_timer_controls)

        #Place widgets within boxes
        self.box_timer_bar.append(self.timer_progress_bar)
        self.box_timer_controls.append(self.button_stop_timer)
        self.box_timer_controls.append(self.button_start_timer)
        self.box_timer_controls.append(self.timer_input_field)

    def check_timer(self):
        global timer
        with open(timer_info_file, 'r') as timer_raw:
            #This re-reads the file if the first read fails
            try:
                timer = json.loads(timer_raw.read())
            except:
                time.sleep(0.1)
                timer = json.loads(timer_raw.read())

            #If timer at zero, check if dismissed. If not, say timer done
            if timer["remaining_length"] == 0:
                if timer["dismissed"] == False:
                    self.timer_progress_bar.set_text("Timer done")
                    self.timer_progress_bar.set_fraction(0)
                else:
                    self.timer_progress_bar.set_text("No Timer")
                    self.timer_progress_bar.set_fraction(0)
            #If timer not at zero, update the progress bar with the stats
            else:
                self.timer_progress_bar.set_text(str(timer["remaining_length"]))
                self.timer_progress_bar.set_fraction(timer["remaining_length"]/timer["starting_length"])
        return True                

    def stop_timer(self, button):
        #Make stop file to be found by the timer-sync program
        with open(timer_stop_file, 'w') as timer_stop:
            pass
        print("stop")

    def start_timer(self,button):
        #Make start file with desired length to be found by the timer-sync program
        start_timer_json = {"length" : int(self.validate_timer_input())}
        with open(timer_start_file, 'w') as timer_start:
            timer_start.write(json.dumps(start_timer_json))
        print(start_timer_json)

    #Ensures that the timer input is valid
    def validate_timer_input(self):

        #Get each letter as an array from the text field
        user_input = self.timer_input_field.get_text().split()
        length = 0

        #Checks if input in format "2 mins and 1 sec"
        if len(user_input) == 5 and user_input[2] == "and":
            try:
                length = int(user_input[0]) * 60 + int(user_input[3])
            except:
                length = 0

        #Checks if input in format "2 min 1 sec"
        elif len(user_input) == 4:
            try:
                length = int(user_input[0]) * 60 + int(user_input[2])
            except:
                length = 0
                
        elif len(user_input) == 2 and (user_input[1] == "min" or user_input[1] == "mins" or user_input[1] == "minute" or user_input[1] == "minutes"):
            try:
                length = int(user_input[0]) * 60
            except:
                length = 0

        elif len(user_input) == 2 and (user_input[1] == "sec" or user_input[1] == "secs" or user_input[1] == "second" or user_input[1] == "seconds"):
            try:
                length = int(user_input[0])
            except:
                length = 0
                
        elif len(user_input) == 1:
            try:
                length = int(user_input[0])
            except:
                length = 0

        return length

    #Refreshes UI and checks timer stats
    def refresh_stuff(self):
        global timer
        #Send web request to check timer server
        self.check_timer()

        #Enable start button only if length entered is valid and timer isn't running
        if self.validate_timer_input() != 0 and timer["dismissed"] == True:
            self.button_start_timer.set_sensitive(True)
        else:
            self.button_start_timer.set_sensitive(False)

        #Enable stop button only if length entered
        if timer["dismissed"] == False:
            self.button_stop_timer.set_sensitive(True)
        else:
            self.button_stop_timer.set_sensitive(False)

        return True



class MyApp(Adw.Application):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.connect('activate', self.on_activate)

    def on_activate(self, app):
        self.win = MainWindow(application=app)
        self.win.present()

app = MyApp(application_id="com.issacdowling.timers")
app.run(sys.argv)

#Ends all background timer syncing processes related to the app when window is closed
subprocess.run("kill $(pgrep -f 'timer-sync-linux-app.py')", shell=True)
