// Import necessary stuff
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { parse } from 'url';
import {watch, watchFile, readFile, writeFile} from 'fs';

//Create server to listen for connections, and the "sub-servers" (?) to handle requests based on path.
const server = createServer();
const wsTimer = new WebSocketServer({ noServer: true });
const wsStopWatch = new WebSocketServer({ noServer: true });

const PORT = 4761
//When testing, make it somewhere other than the repo, or five server will auto refresh, breaking things
const working_directory = ""
const timer_file = working_directory + "timer_file.json"
const start_timer_file = working_directory + "start_timer"
const stop_timer_file = working_directory + "stop_timer"

const stopwatch_file = working_directory + "stopwatch_file.json"
const start_stopwatch_file = working_directory + "start_stopwatch"
const clear_stopwatch_file = working_directory + "clear_stopwatch"
const pause_stopwatch_file = working_directory + "pause_stopwatch"

let timerLastSuccessTime = 0;
let timerAttemptedTime;

let stopwatchLastSuccessTime = 0;
let stopwatchAttemptedTime;

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
      timerAttemptedTime = Math.floor(new Date().getTime())
      if (timerAttemptedTime - timerLastSuccessTime > 100) {
        timerLastSuccessTime = timerAttemptedTime

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

//For connections to /stopwatch
wsStopWatch.on('connection', function connection(ws) {
  
  //when a message is received:
  ws.on('message', function incoming(message) {

    //On any recieved message, send client the current state
    readFile(stopwatch_file, 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log("sw" + data);
      ws.send(data);
    })

    let rec_msg_json = JSON.parse(message)

    //Check if the message is for starting the timer
    //If client asks to start, make start_timer file
    if ("source" in rec_msg_json) {
      writeFile(start_stopwatch_file, JSON.stringify({"source": rec_msg_json["source"]}), function (err) {
        if (err) throw err;
        console.log('Start file created');
      });
    }

    //Check if the message is for clearing the stopwatch
    //If client asks to stop, make clear_stopwatch file
    if ("clear" in rec_msg_json) {
      writeFile(clear_stopwatch_file, "clear", function (err) {
        if (err) throw err;
        console.log('clear_stopwatch file created');
      });
    }

    //Check if the message is for pausing the stopwatch
    //If client asks to stop, make pause_stopwatch file
    if ("pause" in rec_msg_json) {
      writeFile(pause_stopwatch_file, "pause", function (err) {
        if (err) throw err;
        console.log('pause_stopwatch file created');
      });
    }

    // When the timer file changes, do this:
    watch(stopwatch_file, (currentStat, prevStat) => {
      //Read the contents of the file and pass it on

      //STUPID DEBOUNCING A FILE WATCHING THING.
      //GET THE TIME OF THE LAST SUCCESSFUL READ
      //DON'T DO ANYTHING IF JUST A SUPER QUICK REPEAT
      stopwatchAttemptedTime = Math.floor(new Date().getTime())
      if (stopwatchAttemptedTime - stopwatchLastSuccessTime > 100) {
        stopwatchLastSuccessTime = stopwatchAttemptedTime

        readFile(stopwatch_file, 'utf8', (err, data) => {
          if (err) {
            console.error(err);
            return;
          }
          //Send data to all clients of the websocket
          wsStopWatch.clients.forEach( client => {
            client.send(data);    //Let the client know what's going on if they send a message
            readFile(stopwatch_file, 'utf8', (err, data) => {
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

//Handle upgrading to the right websocket route based on path in URL
server.on('upgrade', function upgrade(request, socket, head) {
  const { pathname } = parse(request.url);

  //If user goes to /timer, send them to wsTimer
  if (pathname === '/timer') {
    wsTimer.handleUpgrade(request, socket, head, function done(ws) {
      wsTimer.emit('connection', ws, request);
    });
  //If user goes to /stopwatch, send them to wsStopwatch
  } else if (pathname === '/stopwatch') {
    wsStopWatch.handleUpgrade(request, socket, head, function done(ws) {
      wsStopWatch.emit('connection', ws, request);
    });
  //If user goes nowhere, end connection.
  } else {
    socket.destroy();
  }
});


//Start server on port 3000
server.listen(PORT);