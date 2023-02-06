import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TextInput, TouchableOpacity, Vibration, PlatformColor, Platform } from 'react-native';
import ProgressBar from 'react-native-progress/Bar';
// import * as Device from 'expo-device';
// import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
//To ensure that, when switching between data and WIFI, the app doesn't need to be restarted
import ReconnectingWebSocket from 'reconnecting-websocket';

// Establish websocket connection
const ip = "10.20.11.26"
let socket = new ReconnectingWebSocket("ws://" + ip + ":4762/timer");
const source = "PC";
//This would always be one input behind if it were a react state, so it's a variable.
let timerInputString;
let progress = 0;
let received_source = "Unknown";
let notified = false;
let recieved_json;

//Custom colours based on Material You phone settings.
//If not, just allow defaults.
let backgroundColourHex;
let mainButtonBGColourHex;
let darkTextColourHex;
let lightTextColourHex;
let progressBarColourHex;
let sourceTextBGColourHex;

if (Platform.OS === 'android') {
  backgroundColourHex = PlatformColor('@android:color/system_neutral2_900');
  mainButtonBGColourHex = PlatformColor('@android:color/system_accent1_200')
  darkTextColourHex = PlatformColor('@android:color/system_accent1_900');
  lightTextColourHex = PlatformColor('@android:color/system_accent1_200');
  sourceTextBGColourHex = PlatformColor('@android:color/system_accent2_100');
  // progressBarColourHex = PlatformColor('@android:color/system_accent1_900');
  progressBarColourHex = "#2e295c";
} else {
  backgroundColourHex = "#1c1b1f"
  mainButtonBGColourHex = "#c6bffa"
  darkTextColourHex = "#2e295c";
  lightTextColourHex = "#c6bffa"
  progressBarColourHex = "#2e295c";
  sourceTextBGColourHex = 'gray';
}
// End of custom colour stuff

if (Platform.OS === 'android') {
  //NOTIFICATION STUFF///
  //MAKE IT PLAY SOUND AND BUZZ THE PHONE//
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // //Hopefully keep the app alive in the background
  // const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';
  // TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, ({ data, error, executionInfo }) => {
  //   console.log('BG Notif got');
  // });

  // Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
}


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
    received_source = recieved_json["source"];

    //If timer-related
    if ("remaining_length" in recieved_json) {

      // If timer running, button stops timer, and vice versa
      if (recieved_json["dismissed"]) {
        setMainButtonProperties({"text" : "START", "funct" : sendStartTimer})
        received_source = ""
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

        //If user is on web, handle notifs/vibration differently
        if (Platform.OS === 'web') {
          //Won't do anything with notifs or vibration
        }
        else {

          //If timer done but not dismissed, start vibrating and send notif.
          if (recieved_json["remaining_length"] == 0 && recieved_json["dismissed"] == false) {
            
            if (notified == false) {
              Notifications.scheduleNotificationAsync({ content: {title: "Timer Complete", body: "00:00"}, trigger: null});
              notified = true;
              Vibration.vibrate([80,300], true)
            }
           
          //Once dismissed, stop vibrating and dismiss all notifs.
          } else {
              notified = false;
              Notifications.dismissAllNotificationsAsync();
              Vibration.cancel();
            
          }
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

      <View style={styles.sourceTextView}>
        <View style={{alignSelf: 'center'}}>
          <Text style={styles.sourceText}>{received_source}</Text>
        </View>
      </View>

      <TouchableOpacity onPress={mainButtonProperties["funct"]}>
        <View style={styles.startButtonView}>
          <Text style={{ color: darkTextColourHex, fontSize:80, fontWeight: '700' }}>{mainButtonProperties["text"]}</Text>
          <ProgressBar progress={Number(progress)} size={500} color={progressBarColourHex}  width={260} height={40} borderRadius={20} borderWidth={7}/>
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
    color: lightTextColourHex,
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
  sourceText: {
    color: darkTextColourHex,
    fontSize: 20,
    minWidth: 20,
    fontWeight: '700',
    alignItems: 'center',
  },
  startButtonView: {
    backgroundColor: mainButtonBGColourHex,
    alignItems: 'center', 
    justifyContent: 'center',
    borderRadius: 100,
    margin: 15,
    height: 300,
  },
  sourceTextView: {
    backgroundColor: sourceTextBGColourHex,
    alignSelf: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    margin: 15,
    height: 30,
    width: 100
  }
});