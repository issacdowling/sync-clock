// Import necessary stuff
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { parse } from 'url';
import {watch, watchFile, readFile, writeFile} from 'fs';


//Create server to listen for connections, and the "sub-servers" (?) to handle requests based on path.
const server = createServer();
const wsTimer = new WebSocketServer({ noServer: true });
const wsNotTimer = new WebSocketServer({ noServer: true });

const serverPort = 4762
//When testing, make it somewhere other than the repo, or five server will auto refresh, breaking things
const working_directory = ""
const timer_file = working_directory + "timer_file.json"
const start_timer_file = working_directory + "start_timer"
const stop_timer_file = working_directory + "stop_timer"

let lastSuccessTime = 0;
let attemptedTime;

//For connections to /timer
wsTimer.on('connection', function connection(ws) {
  
  //when a message is received:
  ws.on('message', function incoming(message) {

    //On any recieved message, send client the current state
    readFile(timer_file, 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log(data);
      ws.send(data);
    })

    let rec_msg_json = JSON.parse(message)

    //Check if the message is for starting the timer
    //If client asks to start, make start_timer file
    if ("source" in rec_msg_json) {
      writeFile(start_timer_file, JSON.stringify({"length": rec_msg_json["length"], "source": rec_msg_json["source"]}), function (err) {
        if (err) throw err;
        console.log('Start file created');
      });
    }

    //Check if the message is for stopping the timer
    //If client asks to stop, make stop_timer file
    if ("stop" in rec_msg_json) {
      writeFile(stop_timer_file, "stop", function (err) {
        if (err) throw err;
        console.log('Stop file created');
      });
    }

      // When the timer file changes, do this:
  watch(timer_file, (currentStat, prevStat) => {
    //Read the contents of the file and pass it on

    //STUPID DEBOUNCING A FILE WATCHING THING.
    //GET THE TIME OF THE LAST SUCCESSFUL READ
    //DON'T DO ANYTHING IF JUST A SUPER QUICK REPEAT
    attemptedTime = Math.floor(new Date().getTime())
    if (attemptedTime - lastSuccessTime > 100) {
      lastSuccessTime = attemptedTime

      readFile(timer_file, 'utf8', (err, data) => {
        if (err) {
          console.error(err);
          return;
        }
        //Send data to all clients of the websocket
        wsTimer.clients.forEach( client => {
          client.send(data);    //Let the client know what's going on if they send a message
          readFile(timer_file, 'utf8', (err, data) => {
            if (err) {
              console.error(err);
              return;
            }
            console.log(data);
            ws.send(data);
          })
        });
      });
    }
  });

    //Log the recieved message
    console.log(message.toString('utf-8'))


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