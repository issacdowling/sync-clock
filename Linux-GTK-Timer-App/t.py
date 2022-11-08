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
        self.box1 = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL)
        self.box2 = Gtk.Box(orientation=Gtk.Orientation.VERTICAL)
        self.box3 = Gtk.Box(orientation=Gtk.Orientation.VERTICAL)

        self.box2.set_spacing(10)
        self.box2.set_margin_top(10)
        self.box2.set_margin_bottom(10)
        self.box2.set_margin_start(10)
        self.box2.set_margin_end(10)


        self.set_child(self.box1)
        self.button1 = Gtk.Button(label="Dismiss")
        self.timer_progress_bar = Gtk.ProgressBar(show_text=True)

        self.box1.append(self.box2)
        self.box1.append(self.box3)
        self.box2.append(self.timer_progress_bar)

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

app = MyApp(application_id="com.example.GtkApplication")
app.run(sys.argv)
