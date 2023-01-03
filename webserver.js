// Import necessary stuff
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { parse } from 'url';

//Create server to listen for connections, and the "sub-servers" (?) to handle requests based on path.
const server = createServer();
const wsTimer = new WebSocketServer({ noServer: true });
const wsNotTimer = new WebSocketServer({ noServer: true });

const serverPort = 3000

//For connections to /timer
wsTimer.on('connection', function connection(ws) {
    ws.send("TEST")
    //when a message is received, log it
    ws.on('message', function incoming(message) {

        console.log(message.toString('utf-8'))

        //Do this for each websocket client when a message is receives
        wsTimer
        .clients
        .forEach( client => {
            //send the client the current message
            //client.send(`{ "message" : ${message} }`);
        });
    })
});

//For connections to /not_timer
wsNotTimer.on('connection', function connection(ws) {
  ws.send("NOT A TEST")
});

//Handle upgrading to the right websocket route based on path in URL
server.on('upgrade', function upgrade(request, socket, head) {
  const { pathname } = parse(request.url);

  //If user goes to /timer, send them to wsTimer
  if (pathname === '/timer') {
    wsTimer.handleUpgrade(request, socket, head, function done(ws) {
      wsTimer.emit('connection', ws, request);
    });
  //If user goes to /not_timer, send them to wsNotTimer
  } else if (pathname === '/not_timer') {
    wsNotTimer.handleUpgrade(request, socket, head, function done(ws) {
      wsNotTimer.emit('connection', ws, request);
    });
  //If user goes nowhere, end connection.
  } else {
    socket.destroy();
  }
});

//Start server on port 3000
server.listen(serverPort);