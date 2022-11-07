from flask import Flask

print("test")

app = Flask(__name__)
                     
@app.route('/')      
def index():         
    test = open('test', 'r')
    return test      
                    
@app.route('/timer')
def timer():
    timer_file = open('timer_file.json', 'r')
    return timer_file

@app.route('/balls') 
def balls():
    return "balls"

if __name__ == "__main__":
    app.run()
