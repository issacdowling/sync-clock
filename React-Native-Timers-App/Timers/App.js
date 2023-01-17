import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TextInput, TouchableOpacity } from 'react-native';



// Establish websocket connection
const ip = "10.0.0.20"
let socket = new WebSocket("ws://" + ip + ":4762/timer");
let timer_is_running = false;
const source = "Phone";

let backgroundColourHex = "#1c1b1f"

export default function App() {

  // Set state for the text input field
  const [inputtedTimerLength, setInputtedTimerLength] = useState('');

  // Set state for the timer output string
  const [timerDisplayString, setTimerDisplayString] = useState('no_c')

  // Set state for whether button is to start or stop timer
  const [buttonStartsTimer, setButtonStartsTimer] = useState({"funct" : "", "text" : "test"})

  // When the connection is opened:
  socket.onopen = function(e) {
    console.log("[open] Connection established");
    socket.send(JSON.stringify({"hello" : "there"}))
  };

  //Takes the text from the input field and turns it into a number of seconds, outputs to 'inputtedTimerLength'
  function getInputLength(inputText) {
    console.log("intext " +inputText)
    console.log(inputtedTimerLength)
    setInputtedTimerLength(inputText);
  }

  //Sends the JSON for stopping the timer
  function sendStopTimer() {
    socket.send(JSON.stringify({"stop" : "please"}));
  }

  function sendStartTimer() {
    socket.send(JSON.stringify({"length" : Number(inputtedTimerLength), "source" : source}))
  }



  // When the connection recieves a message:
socket.onmessage = function(event) {
  let length;
  let recieved_json;
  console.log(`[message] Data received from server: ${event.data}`);
  recieved_json = JSON.parse(event.data)

  //If timer-related
  if ("remaining_length" in recieved_json) {

    // If timer running, button stops timer, and vice versa
    if (recieved_json["dismissed"]) {
      setButtonStartsTimer({"text" : "START", "funct" : sendStartTimer})
    } else {
      setButtonStartsTimer({"text" : "STOP", "funct" : sendStopTimer})
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
      
  }
  
  return (
    <View style={styles.container}>

      <View style={{alignSelf: 'center'}}>
      <TextInput style={styles.inputText} placeholderTextColor={'grey'} onChangeText={getInputLength} keyboardType='numeric'/>
      </View>
      
      <View>
        <Text style={styles.timeLeftText}>{timerDisplayString}</Text>
      </View>

      <TouchableOpacity onPress={buttonStartsTimer["funct"]}>
        <View style={styles.startButton}>
          <Text style={{ color: '#2e295c', fontSize:100 }}>{buttonStartsTimer["text"]}</Text>
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