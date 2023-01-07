// Make websocket connection to server
const ip = "10.0.0.20"
let socket = new WebSocket("ws://" + ip + ":4761/timer");
let timer_is_running = false;

function send_toggle_timer() {
    console.log(timer_is_running)
    if (timer_is_running) {
        let duration_input_json = {"stop" : true}
        socket.send(JSON.stringify(duration_input_json))
    } else if (timer_is_running == false) {
        let duration_input = document.querySelector("#duration_input").value
        let duration_input_json = {"length" : duration_input, "source" : "test"}
        socket.send(JSON.stringify(duration_input_json))
    }

}

// When the connection is opened:
socket.onopen = function(e) {
    console.log("[open] Connection established");
};

// When the connection errors:
socket.onerror = function(error) {
    console.log(`[error]`);
    };

// When the connection recieves a message:
socket.onmessage = function(event) {
    console.log(`[message] Data received from server: ${event.data}`);
    recieved_json = JSON.parse(event.data)

    //If timer-related
    if ("length" in recieved_json) {
        //Set the div to the time remaining
        document.getElementById("length").innerHTML = recieved_json["length"]

        if (recieved_json["dismissed"] == false) {
            timer_is_running = true;
            document.getElementById("timer_toggle_button").innerHTML = "Stop Timer"
        } else if (recieved_json["dismissed"]) {
            timer_is_running = false;
            document.getElementById("timer_toggle_button").innerHTML = "Start Timer"
        }
        
    }
    
    document.querySelector("#debug").innerHTML = event.data
    };
