from flask import Flask

print("test")

app = Flask(__name__)

@app.route('/')
def index():
    return "Test"

@app.route('/balls')
def balls():
    return "balls"

if __name__ == "__main__":
    app.run()
