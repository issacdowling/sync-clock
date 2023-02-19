import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TextInput, TouchableOpacity, Vibration, PlatformColor, Platform } from 'react-native';
import ProgressBar from 'react-native-progress/Bar';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
//To ensure that, when switching between data and WIFI, the app doesn't need to be restarted
import ReconnectingWebSocket from 'reconnecting-websocket';

// Establish websocket connection
const ip = "10.0.0.20"
let TimerSocket = new ReconnectingWebSocket("ws://" + ip + ":4761/timer");
let StopSocket = new ReconnectingWebSocket("ws://" + ip + ":4761/stopwatch");
let TimerProgress = 0;
let TimerReceivedSource = "Unknown";
let StopReceivedSource = "Unknown";
let notified = false;
let TimerReceivedJson;
let StopReceivedJson;
let source;
//This would always be one input behind if it were a react state, so it's a variable.
let timerInputString;

//Custom colours based on Material You phone settings.
//If not, just allow defaults.
let backgroundColourHex;
let mainButtonBGColourHex;
let darkTextColourHex;
let lightTextColourHex;
let progressBarColourHex;
let sourceTextBGColourHex;
let clearButtonBGColourHex;

// Set colours, choosing platform defaults where possible
if (Platform.OS === 'android') {
  backgroundColourHex = PlatformColor('@android:color/system_neutral2_900');
  mainButtonBGColourHex = PlatformColor('@android:color/system_accent1_200')
  clearButtonBGColourHex = PlatformColor('@android:color/system_accent1_800')
  darkTextColourHex = PlatformColor('@android:color/system_accent1_900');
  lightTextColourHex = PlatformColor('@android:color/system_accent1_200');
  sourceTextBGColourHex = PlatformColor('@android:color/system_accent2_100');
  // progressBarColourHex = PlatformColor('@android:color/system_accent1_900');
  progressBarColourHex = "#2e295c";
} else {
  backgroundColourHex = "#1c1b1f"
  mainButtonBGColourHex = "#c6bffa"
  clearButtonBGColourHex = "#2e295c"
  darkTextColourHex = "#2e295c";
  lightTextColourHex = "#c6bffa"
  progressBarColourHex = "#2e295c";
  sourceTextBGColourHex = "#E6E6E3";
}

// Set up notifications on mobile
if (Platform.OS === 'android' || Platform.OS === 'ios') {
  //NOTIFICATION STUFF///
  //MAKE IT PLAY SOUND AND BUZZ THE PHONE//
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

//SET SOURCE TO YOUR DEVICE NAME
if (Device.modelName != null) {
  source = Device.modelName
} else {
  source = "Web"
}
  
export default function App() {

  // Set state for the timer output string
  // This would just be a variable but it was always one behind if I did that. Same with mainButtonProperties
  // Don't quite know why, since I had the opposite issue with timerInputString. S
  const [timerDisplayString, setTimerDisplayString] = useState('no_c')

  const [stopwatchDisplayString, setStopwatchDisplayString] = useState('no_c')

  // Set state for whether button is to start or stop timer
  const [mainTimerButtonProperties, setMainTimerButtonProperties] = useState({"funct" : "", "text" : "test"})

  // Set state for whether button is to start or clear stopwatch
  const [mainStopwatchButtonProperties, setMainStopwatchButtonProperties] = useState({"funct" : "", "text" : "test"})

  // When the timer connection is opened:
  TimerSocket.onopen = function(e) {
    console.log("Timer Connection established");
    TimerSocket.send(JSON.stringify({"hello" : "timer"}))
  };

  // When the timer connection is opened:
  StopSocket.onopen = function(e) {
    console.log("Stopwatch Connection established");
    StopSocket.send(JSON.stringify({"hello" : "stopwatch"}))
  };

  //Takes the text from the input field and turns it into a number of seconds, outputs to 'inputtedTimerLength'
  function getInputLength(inputText) {
    timerInputString = inputText;
  }

  //Sends the JSON for stopping the timer
  function sendStopTimer() {
    TimerSocket.send(JSON.stringify({"stop" : "please"}));
  }

  function sendStartTimer() {
    TimerSocket.send(JSON.stringify({"length" : Number(timerInputString), "source" : source}))
  }

  function sendStartStopwatch() {
    StopSocket.send(JSON.stringify({"source" : source}))
  }

  function sendClearStopwatch() {
    StopSocket.send(JSON.stringify({"clear" : "please"}))
  }

  function sendPauseStopwatch() {
    StopSocket.send(JSON.stringify({"pause" : "please"}))
  }


  // When the stopwatch connection recieves a message:
  TimerSocket.onmessage = function(event) {
    let length;
    console.log(`Timer Data received from server: ${event.data}`);
    TimerReceivedJson = JSON.parse(event.data)
    //The percentage of the timer remaining. If NaN, make sure it's 0, or things will break.
    //Also, things break if it goes over 1.
    TimerProgress = (TimerReceivedJson["remaining_length"] / TimerReceivedJson["starting_length"]);
    if (Number.isNaN(TimerProgress)) {
      TimerProgress = 0;
    }
    TimerReceivedSource = TimerReceivedJson["source"];

    //If timer-related
    if ("remaining_length" in TimerReceivedJson) {

      // If timer running, button stops timer, and vice versa
      if (TimerReceivedJson["dismissed"]) {
        setMainTimerButtonProperties({"text" : "START", "funct" : sendStartTimer})
        TimerReceivedSource = ""
      } else {
        setMainTimerButtonProperties({"text" : "STOP", "funct" : sendStopTimer})
      }

        // Convert seconds into hours:minutes:seconds
        let date = new Date(null);
        date.setSeconds(TimerReceivedJson["remaining_length"]);
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
          if (TimerReceivedJson["remaining_length"] == 0 && TimerReceivedJson["dismissed"] == false) {
            
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

  // When the stopwatch connection recieves a message:
  StopSocket.onmessage = function(event) {
    let length;
    console.log(`Stopwatch Data received from server: ${event.data}`);
    StopReceivedJson = JSON.parse(event.data)

    //If stopwatch-related
    if ("seconds" in StopReceivedJson) {

      // If stopwatch running, button stops timer, and vice versa
      if (StopReceivedJson["seconds"]) {
        setMainStopwatchButtonProperties({"text" : "PAUSE", "funct" : sendPauseStopwatch})
        StopReceivedSource = StopReceivedJson["source"]
      } else {
        setMainStopwatchButtonProperties({"text" : "START", "funct" : sendStartStopwatch})
        StopReceivedSource = ""
      }

        // Convert seconds into hours:minutes:seconds
        let date = new Date(null);
        date.setSeconds(StopReceivedJson["seconds"]);
        length = date.toISOString().substr(11, 8);
        // Checks if hours are empty, shorten if so.
        if (length.slice(0,3) == "00:") {
            length = length.slice(3)
        }

        //Set the div to the time remaining
        setStopwatchDisplayString(length);

        }
  }


  const Stack = createNativeStackNavigator();

  const TimerScreen = ({navigation}) => {
    return (
      <View style={TimerStyles.container}>
        <View style={{alignSelf: 'center'}}>
          <TextInput style={TimerStyles.inputText} placeholderTextColor={'grey'} onChangeText={getInputLength} keyboardType='numeric'/>
        </View>
        
        <View>
          <Text style={TimerStyles.timeLeftText}>{timerDisplayString}</Text>
        </View>

        <View style={TimerStyles.sourceTextView}>
          <View style={{alignSelf: 'center'}}>
            <Text style={TimerStyles.sourceText}>{TimerReceivedSource}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={mainTimerButtonProperties["funct"]}>
          <View style={TimerStyles.startButtonView}>
            <Text style={{ color: darkTextColourHex, fontSize:80, fontWeight: '700' }}>{mainTimerButtonProperties["text"]}</Text>
            <ProgressBar progress={Number(TimerProgress)} size={500} color={progressBarColourHex}  width={260} height={40} borderRadius={20} borderWidth={7}/>
          </View>
        </TouchableOpacity>

        <StatusBar style="auto" />

        <Button title="Stopwatch" onPress={() => navigation.navigate('Stopwatch') }/>

      </View>
    );
  };

  const StopwatchScreen = ({navigation}) => {
    return (
      <View style={StopwatchStyles.container}>
        
        <View>
          <Text style={StopwatchStyles.timeLeftText}>{stopwatchDisplayString}</Text>
        </View>

        <View style={StopwatchStyles.sourceTextView}>
          <View style={{alignSelf: 'center'}}>
            <Text style={StopwatchStyles.sourceText}>{StopReceivedSource}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={mainStopwatchButtonProperties["funct"]}>
          <View style={StopwatchStyles.startButtonView}>
            <Text style={{ color: darkTextColourHex, fontSize:80, fontWeight: '700' }}>{mainStopwatchButtonProperties["text"]}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={sendClearStopwatch}>
          <View style={StopwatchStyles.clearButtonView}>
            <Text style={{ color: lightTextColourHex, fontSize:40, fontWeight: '700' }}>{"CLEAR"}</Text>
          </View>
        </TouchableOpacity>

        <StatusBar style="auto" />

        <Button title="Timers" onPress={() => navigation.navigate('Timers') }/>

      </View>
    );
  };

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Timers" component={TimerScreen} options={{headerShown: false}}/>
        <Stack.Screen name="Stopwatch" component={StopwatchScreen} options={{headerShown: false}}/>
       
      </Stack.Navigator>
    </NavigationContainer>
  );

}

const TimerStyles = StyleSheet.create({
  
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

const StopwatchStyles = StyleSheet.create({
  
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
  clearButtonView: {
    backgroundColor: clearButtonBGColourHex,
    alignItems: 'center', 
    justifyContent: 'center',
    borderRadius: 100,
    margin: 15,
    height: 60,
    alignSelf: 'center',
    width: 200
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