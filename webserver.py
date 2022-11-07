from flask import Flask

print("test")

app = Flask(__name__)

test = open('test', 'r')

@app.route('/')
def index():
    return test

@app.route('/balls')
def balls():
    return "balls"

if __name__ == "__main__":
    app.run()
