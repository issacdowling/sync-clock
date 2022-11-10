import sys
import gi
import random
import time
import requests
gi.require_version('Gtk', '4.0')
gi.require_version('Adw', '1')
from gi.repository import Gtk, Adw, GLib

class MainWindow(Gtk.ApplicationWindow):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        

        GLib.timeout_add_seconds(1, self.connect_timer)

        test = random.randint(1,20)

        #Basic window setup
        self.set_default_size(300, 250)
        self.set_title("Timers")

        #Create header with button
        self.header = Gtk.HeaderBar()
        self.set_titlebar(self.header)
        self.connect_timer_button = Gtk.Button(label=test)
        self.connect_timer_button.connect('clicked', self.connect_timer)
        self.header.pack_start(self.connect_timer_button)
        #Create button for attempting to get timer info
        self.box1 = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, halign=Gtk.Align.CENTER)
        self.box2 = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, halign=Gtk.Align.CENTER)
        self.box3 = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, halign=Gtk.Align.CENTER, valign=Gtk.Align.CENTER, spacing=20)
        self.box4 = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, halign=Gtk.Align.CENTER, homogeneous=True, spacing=10)

        self.button1 = Gtk.Button(label="Dismiss")
        self.button2 = Gtk.Button(label="test")
        self.button3 = Gtk.Button(label="t2")

        self.timer_progress_bar = Gtk.ProgressBar(show_text=True)

        self.set_child(self.box1) # Window has horizontal box
        self.box3.append(self.box4)
        self.box1.append(self.box2)
        self.box1.append(self.box3)

#        self.box3.set_spacing(10)
#       self.box3.set_margin_top(10)
#       self.box3.set_margin_bottom(10)
#       self.box3.set_margin_start(10)
#       self.box3.set_margin_end(10)

        self.box3.append(self.timer_progress_bar)
        self.box4.append(self.button1)
        self.box4.append(self.button2)
        self.box4.append(self.button3)

        self.connect_timer_button.connect('clicked', self.connect_timer)

    def connect_timer(self):
        try:
            timer = requests.get("http://localhost:5000/timer").json()
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
            self.timer_progress_bar.set_text(str(timer["seconds"]))
            self.timer_progress_bar.set_fraction(timer["seconds"]/timer["starting_seconds"])
        return True                

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

