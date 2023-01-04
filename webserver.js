// Import necessary stuff
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { parse } from 'url';
import {watch, readFile, writeFile} from 'fs';

//Create server to listen for connections, and the "sub-servers" (?) to handle requests based on path.
const server = createServer();
const wsTimer = new WebSocketServer({ noServer: true });
const wsNotTimer = new WebSocketServer({ noServer: true });

const serverPort = 3000
//When testing, make it somewhere other than the repo, or five server will auto refresh, breaking things
const working_directory = "/home/issacdowling/Downloads/"
const timer_file = working_directory + "timer_file.json"
const start_timer_file = working_directory + "start_timer"
const stop_timer_file = working_directory + "stop_timer"

//For connections to /timer
wsTimer.on('connection', function connection(ws) {
    ws.send("TEST")
    //when a message is received, log it
    ws.on('message', function incoming(message) {

      let rec_msg_json = JSON.parse(message)
      //Check if the message is for starting the timer
      //If client asks to start, make start_timer file
      if ("source" in rec_msg_json) {
        writeFile(start_timer_file, JSON.stringify({"length": rec_msg_json["length"], "source": rec_msg_json["source"]}), function (err) {
          if (err) throw err;
          console.log('File is created successfully.');
        });
      }

      //Check if the message is for stopping the timer
      //If client asks to stop, make stop_timer file
      if ("stop" in rec_msg_json) {
        writeFile(stop_timer_file, "stop", function (err) {
          if (err) throw err;
          console.log('File is created successfully.');
        });
      }

        console.log(message.toString('utf-8'))

        //Do this for each websocket client when a message is receives
        wsTimer
        .clients
        .forEach( client => {

            //client.send(`{ "message" : ${message} }`);
        });
    
    // When the timer file changes, do this:
    watch(timer_file, (currentStat, prevStat) => {
        //Create buffer to check for changing data
        let timer_file_is_free = true;
        //Read the contents of the file and pass it on
        readFile(timer_file, 'utf8', (err, data) => {
            if (err) {
              console.error(err);
              return;
              //Only do this if the file is not currently in use (prevents multiple accesses for the same change because fs.watchFile is buggy)
            } else if (timer_file_is_free) {
                timer_file_is_free = false;
                // Something else
                console.log(data);
                ws.send(data)
                timer_file_is_free = true;
            }
            
          });
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