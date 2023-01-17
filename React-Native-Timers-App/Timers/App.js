import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TextInput, TouchableOpacity, Vibration } from 'react-native';
import ProgressBar from 'react-native-progress/Bar';

// Establish websocket connection
const ip = "10.20.11.26"
let socket = new WebSocket("ws://" + ip + ":4762/timer");
const source = "Phone";
let recieved_json;
let progress = 0;

//This would always be one input behind if it were a react state, so it's a variable.
let timerInputString;
let backgroundColourHex = "#1c1b1f"

export default function App() {

  // Set state for the timer output string
  // This would just be a variable but it was always one behind if I did that. Same with mainButtonProperties
  // Don't quite know why, since I had the opposite issue with timerInputString. S
  const [timerDisplayString, setTimerDisplayString] = useState('no_c')

  // Set state for whether button is to start or stop timer
  const [mainButtonProperties, setMainButtonProperties] = useState({"funct" : "", "text" : "test"})

  // When the connection is opened:
  socket.onopen = function(e) {
    console.log("[open] Connection established");
    socket.send(JSON.stringify({"hello" : "there"}))
  };

  //Takes the text from the input field and turns it into a number of seconds, outputs to 'inputtedTimerLength'
  function getInputLength(inputText) {
    timerInputString = inputText;
  }

  //Sends the JSON for stopping the timer
  function sendStopTimer() {
    socket.send(JSON.stringify({"stop" : "please"}));
    console.log(recieved_json)
  }

  function sendStartTimer() {
    socket.send(JSON.stringify({"length" : Number(timerInputString), "source" : source}))
  }

    // When the connection recieves a message:
  socket.onmessage = function(event) {
    let length;
    console.log(`[message] Data received from server: ${event.data}`);
    recieved_json = JSON.parse(event.data)
    //The percentage of the timer remaining. If NaN, make sure it's 0, or things will break.
    //Also, things break if it goes over 1.
    progress = (recieved_json["remaining_length"] / recieved_json["starting_length"]);
    if (Number.isNaN(progress)) {
      progress = 0;
    }


    //If timer-related
    if ("remaining_length" in recieved_json) {

      // If timer running, button stops timer, and vice versa
      if (recieved_json["dismissed"]) {
        setMainButtonProperties({"text" : "START", "funct" : sendStartTimer})
      } else {
        setMainButtonProperties({"text" : "STOP", "funct" : sendStopTimer})
      }

        // Convert seconds into hours:minutes:seconds
        let date = new Date(null);
        date.setSeconds(recieved_json["remaining_length"]);
        length = date.toISOString().substr(11, 8);
        // Checks if hours are empty, shorten if so.
        if (length.slice(0,3) == "00:") {
            length = length.slice(3)
        }

        //Set the div to the time remaining
        setTimerDisplayString(length);

        }

        //If timer done but not dismissed, start vibrating
        if (recieved_json["remaining_length"] == 0 && recieved_json["dismissed"] == false) {
          Vibration.vibrate([80,300], true)
          console.log("s")
        } else {
          console.log("stopping vibe")
          Vibration.cancel()
        }
      
  }

  return (
    <View style={styles.container}>

      <View style={{alignSelf: 'center'}}>
      <TextInput style={styles.inputText} placeholderTextColor={'grey'} onChangeText={getInputLength} keyboardType='numeric'/>
      </View>
      
      <View>
        <Text style={styles.timeLeftText}>{timerDisplayString}</Text>
      </View>

      <TouchableOpacity onPress={mainButtonProperties["funct"]}>
        <View style={styles.startButton}>
          <Text style={{ color: '#2e295c', fontSize:100 }}>{mainButtonProperties["text"]}</Text>
          <ProgressBar progress={Number(progress)} size={500} color={"#2e295c"} width={260} height={40} borderRadius={20} borderWidth={7}/>
         </View>
      </TouchableOpacity>

      

      <StatusBar style="auto" />

    </View>
  );

}

const styles = StyleSheet.create({
  
  container: {
    flex: 1,
    padding: 60,
    backgroundColor: backgroundColourHex,
    alignContent: 'center'
  },
  titleText: {
    color: 'white',
    padding: 16
  },
  timeLeftText: {
    color: '#c6bffa',
    padding: 16,
    fontSize: 80,
    textAlign: 'center'
  },
  inputText: {
    color: 'white',
    paddingLeft:20,
    borderColor: 'white',
    borderWidth: 10,
    borderRadius: 20,
    fontSize: 40,
    minWidth: 20,
    alignItems: 'center'
  },
  startButton: {
    backgroundColor: '#c6bffa',
    alignItems: 'center', 
    justifyContent: 'center',
    borderRadius: 100,
    margin: 15,
    height: 300,
  }
});