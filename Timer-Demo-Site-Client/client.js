// Make websocket connection to server
let socket = new WebSocket("ws://127.0.0.1:3000/timer");

function send_start_timer() {
    let duration_input = document.querySelector("#duration_input").value
    let duration_input_json = {"length" : duration_input, "source" : "test"}
    socket.send(JSON.stringify(duration_input_json))
}

function send_stop_timer() {
    let duration_input_json = {"stop" : true}
    socket.send(JSON.stringify(duration_input_json))
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

    
    document.querySelector("#video").innerHTML = event.data
    };
