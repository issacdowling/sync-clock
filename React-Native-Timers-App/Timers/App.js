import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TextInput } from 'react-native';

export default function App() {

  // Establish websocket connection
  const ip = "192.168.0.139"
  let socket = new WebSocket("ws://" + ip + ":4762/timer");
  let timer_is_running = false;
  const source = "Phone";

  // Set state for the text input field
  const [inputtedTimerLength, setInputtedTimerLength] = useState('');

  // Set state for the timer output string
  const [timerDisplayString, setTimerDisplayString] = useState('1')

  // When the connection is opened:
  socket.onopen = function(e) {
    console.log("[open] Connection established");
  };


  //Takes the text from the input field and turns it into a number of seconds, outputs to 'inputtedTimerLength'
  function getInputLength(inputText) {
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
  
  //document.querySelector("#debug").innerHTML = event.data


  return (
    <View style={styles.container}>
      <TextInput style={styles.inputText} placeholder='Time in seconds' placeholderTextColor={'white'} onChangeText={getInputLength}/>
      <View>
        <Button title="START TIMER" onPress={sendStartTimer} color='#c6bffa' />
        <Button title="STOP TIMER" onPress={sendStopTimer} color='#464457'/>
      </View>
        <View>
          <Text style={styles.timeLeftText}>{timerDisplayString}</Text>
        </View>

      <StatusBar style="auto" />
    </View>
  );

  
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 60,
    backgroundColor: "#1c1b1f",
    alignContent: 'center'
  },
  titleText: {
    color: 'white',
    padding: 16
  },
  timeLeftText: {
    color: '#c6bffa',
    padding: 16,
    fontSize: 100,
    textAlign: 'center'
  },
  inputText: {
    color: 'white',
    padding: 16
  },
  button: {
    color: 'white',
    backgroundColor: 'black'
  }
});