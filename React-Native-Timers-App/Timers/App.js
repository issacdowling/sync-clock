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
let TimerSocket = new ReconnectingWebSocket("ws://" + ip + ":4762/timer");
let progress = 0;
let received_source = "Unknown";
let notified = false;
let recieved_json;
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

// Set colours, choosing platform defaults where possible
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

  // Set state for whether button is to start or stop timer
  const [mainButtonProperties, setMainButtonProperties] = useState({"funct" : "", "text" : "test"})

  // When the connection is opened:
  TimerSocket.onopen = function(e) {
    console.log("[open] Connection established");
    TimerSocket.send(JSON.stringify({"hello" : "there"}))
  };

  //Takes the text from the input field and turns it into a number of seconds, outputs to 'inputtedTimerLength'
  function getInputLength(inputText) {
    timerInputString = inputText;
  }

  //Sends the JSON for stopping the timer
  function sendStopTimer() {
    TimerSocket.send(JSON.stringify({"stop" : "please"}));
    console.log(recieved_json)
  }

  function sendStartTimer() {
    TimerSocket.send(JSON.stringify({"length" : Number(timerInputString), "source" : source}))
  }

  // When the connection recieves a message:
  TimerSocket.onmessage = function(event) {
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
            <Text style={TimerStyles.sourceText}>{received_source}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={mainButtonProperties["funct"]}>
          <View style={TimerStyles.startButtonView}>
            <Text style={{ color: darkTextColourHex, fontSize:80, fontWeight: '700' }}>{mainButtonProperties["text"]}</Text>
            <ProgressBar progress={Number(progress)} size={500} color={progressBarColourHex}  width={260} height={40} borderRadius={20} borderWidth={7}/>
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
          <Text style={StopwatchStyles.timeLeftText}>{timerDisplayString}</Text>
        </View>

        <View style={StopwatchStyles.sourceTextView}>
          <View style={{alignSelf: 'center'}}>
            <Text style={StopwatchStyles.sourceText}>{received_source}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={mainButtonProperties["funct"]}>
          <View style={StopwatchStyles.startButtonView}>
            <Text style={{ color: darkTextColourHex, fontSize:80, fontWeight: '700' }}>{mainButtonProperties["text"]}</Text>
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