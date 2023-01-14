import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TextInput } from 'react-native';


export default function App() {

  // Establish websocket connection
  const ip = "10.0.0.20"
  let socket = new WebSocket("ws://" + ip + ":4762/timer");
  let timer_is_running = false;
  const source = "Phone"

  // Set state for the text input field
  const [inputtedTimerLength, setInputtedTimerLength] = useState('');

  // Set state for the timer output string
  const [timerDisplayString, setTimerDisplayString] = useState('')

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
    socket.send(JSON.stringify({"stop" : "please"}))
  }

  function sendStartTimer() {
    socket.send(JSON.stringify({"length" : Number(inputtedTimerLength), "source" : source}))
  }

  return (
    <View style={styles.container}>
      <TextInput style={styles.inputText} placeholder='Time in seconds' placeholderTextColor={'white'} onChangeText={getInputLength}/>
      <View>
        <Button title="START TIMER" onPress={sendStartTimer} style={styles.button}/>
        <Button title="STOP TIMER" onPress={sendStopTimer} style={styles.button}/>
      </View>
        <View>
          <Text>{timerDisplayString}</Text>
        </View>
      <StatusBar style="auto" />
    </View>
  );

  
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 60,
    backgroundColor: '#1e1e1e',
    alignContent: 'center'
  },
  titleText: {
    color: 'white',
    padding: 16
  },
  inputText: {
    color: 'white',
    padding: 16
  },
  button: {
    color: 'white'
  }
});