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
        

        GLib.timeout_add_seconds(1, self.check_timer)

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
        self.box_timer_main = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, halign=Gtk.Align.CENTER, valign=Gtk.Align.CENTER, spacing=20)
        self.box_timer_bar = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, homogeneous=True)
        self.box_timer_controls = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, homogeneous=True, spacing=10)

        #Create timer progress bar
        self.timer_progress_bar = Gtk.ProgressBar(show_text=True, halign=Gtk.Align.FILL)

        #Create timer control buttons
        self.button_stop_timer = Gtk.Button(label="Stop Timer")
        self.button_stop_timer.connect('clicked', self.stop_timer)
        self.button2 = Gtk.Button(label="test")
        self.button3 = Gtk.Button(label="t2")

        #Place boxes
        self.set_child(self.box_timer_main)
        self.box_timer_main.append(self.box_timer_bar)
        self.box_timer_main.append(self.box_timer_controls)

        #Place widgets within boxes
        self.box_timer_bar.append(self.timer_progress_bar)
        self.box_timer_controls.append(self.button_stop_timer)
        self.box_timer_controls.append(self.button2)
        self.box_timer_controls.append(self.button3)

    def check_timer(self):
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

    def updatelabels(self):
        self.connect_timer_button.set_label(str(random.randint(1,300)))
        # NEEDED OR WILL NOT BE CALLED MULTIPLE TIMES
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

