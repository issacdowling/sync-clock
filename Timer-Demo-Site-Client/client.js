// Get useragent
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    uaMobile = true;
  } else {
    uaMobile = false;
  }

// Select css style from HTML
let theme = document.getElementsByTagName('link')[0];

if (uaMobile == true) {
    theme.setAttribute('href', 'mobile.css');
} else if (uaMobile == false) {
    theme.setAttribute('href', 'desktop.css');
}

// Make websocket connection to server
const ip = "10.0.0.200"
let socket = new WebSocket("ws://" + ip + ":4762/timer");
let timer_is_running = false;

function send_toggle_timer() {
    console.log(timer_is_running)
    if (timer_is_running) {
        let duration_input_json = {"stop" : "please"}
        socket.send(JSON.stringify(duration_input_json))
    } else if (timer_is_running == false) {
        let duration_input = document.querySelector("#duration_input").value
        let duration_input_json = {"length" : duration_input, "source" : "test"}
        socket.send(JSON.stringify(duration_input_json))
    }

}

// When the connection recieves a message:
socket.onmessage = function(event) {
    console.log(`[message] Data received from server: ${event.data}`);
    recieved_json = JSON.parse(event.data)

    //If timer-related
    if ("remaining_length" in recieved_json) {

        // Convert seconds into hours:minutes:seconds
        var date = new Date(null);
        date.setSeconds(recieved_json["remaining_length"]);
        length = date.toISOString().substr(11, 8);
        // Checks if hours are empty, shorten if so.
        if (length.slice(0,3) == "00:") {
            length = length.slice(3)
        }

        //Set the div to the time remaining
        document.getElementById("length").innerHTML = length

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

// When the connection is opened:
socket.onopen = function(e) {
    console.log("[open] Connection established");
};

// When the connection errors:
socket.onerror = function(error) {
    console.log(`[error]`);
    };