import sys
import gi
import random
import time
import requests
gi.require_version('Gtk', '4.0')
gi.require_version('Adw', '1')
from gi.repository import Gtk, Adw, GLib

URL = "http://localhost:5000"

class MainWindow(Gtk.ApplicationWindow):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        

        GLib.timeout_add_seconds(1, self.refresh_stuff)

        test = random.randint(1,20)

        #Basic window setup
        self.set_default_size(300, 250)
        self.set_title("Timers")

        #Create header with button
        self.header = Gtk.HeaderBar()
        self.set_titlebar(self.header)
        self.connect_timer_button = Gtk.Button(label=test)
        self.header.pack_start(self.connect_timer_button)

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
        try:
            timer = requests.get(URL + "/timer").json()
        except:
            timer = {"running" : False, "dismissed" : True}
        if timer["running"] == False:
            if timer["dismissed"] == False:
                self.timer_progress_bar.set_text("Timer done")
                self.timer_progress_bar.set_fraction(0)
            else:
                self.timer_progress_bar.set_text("No Timer")
                self.timer_progress_bar.set_fraction(0)
        else:
            self.timer_progress_bar.set_text(str(timer["length"]))
            self.timer_progress_bar.set_fraction(timer["length"]/timer["starting_length"])
        return True                

    def stop_timer(self, button):
        stop = requests.post(URL + "/timer_stop").text
        print(stop)

    def start_timer(self,button):
        print(self.validate_timer_input())



    def validate_timer_input(self):

        user_input = self.timer_input_field.get_text().split()
        length = 0

        #Checks if input in format "2 mins and 1 sec"
        if len(user_input) == 5 and user_input[2] == "and":
            length = int(user_input[0]) * 60 + int(user_input[3])

        #Checks if input in format "2 min 1 sec"
        elif len(user_input) == 4:
            length = int(user_input[0]) * 60 + int(user_input[2])

        elif len(user_input) == 2 and (user_input[1] == "min" or user_input[1] == "mins" or user_input[1] == "minute" or user_input[1] == "minutes"):
            length = int(user_input[0]) * 60

        elif len(user_input) == 2 and (user_input[1] == "sec" or user_input[1] == "secs" or user_input[1] == "second" or user_input[1] == "seconds"):
            length = int(user_input[0])

        elif len(user_input) == 1:
            length = int(user_input[0])

        return length
        


        
        #print(len(user_input.split()))

    def refresh_stuff(self):
        #Send web request to check timer server
        self.check_timer()

        #Enable start button only if length entered is valid
        if self.validate_timer_input() != 0:
            self.button_start_timer.set_sensitive(True)
        else:
            self.button_start_timer.set_sensitive(False)

        #Enable stop button only if length entered
        if timer["running"] == True:
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

