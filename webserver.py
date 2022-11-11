from flask import Flask

app = Flask(__name__)

working_dir = ""

@app.route('/')      
def index():         
    test = open('test', 'r')
    return test      

##Timer stuff

@app.route('/timer')
def timer():
    timer_file = open(working_dir + 'timer_file.json', 'r')
    return timer_file

@app.route('/timer_stop', methods=['POST'])
def timer_stop():
    #Create file called 'stop_timer'
    with open(working_dir + 'stop_timer', 'w') as stop_timer:
        pass
    return "Sent request to stop timer"
## End of timer stuff

@app.route('/balls') 
def balls():
    return "balls"

if __name__ == "__main__":
    app.run()
