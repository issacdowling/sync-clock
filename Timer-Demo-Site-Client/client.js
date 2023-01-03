// Make websocket connection to server
let socket = new WebSocket("ws://127.0.0.1:3000/timer");

function send_entered_message() {
    let entered_message = document.querySelector("#message_to_send").value
    socket.send(entered_message)
}


// When the connection is opened:
socket.onopen = function(e) {
    console.log("[open] Connection established");
    console.log("Sending to server");
    socket.send("Hello");
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
