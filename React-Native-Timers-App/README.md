# Build instructions

In this directory:
```
cd ./Timers
npm i
```

To run, use this command (the options preceeding allow for running locally with outdated SSL stuff):
```
NODE_OPTIONS='--openssl-legacy-provider' expo start
```

## Android APK
This will give you an android apk
```
eas build -p android --profile production
```

## Web
This will give you a web build in the './web-build' directory. You can't serve it from there, something something subfolders. Copy it to the root of where you're serving from.
```
NODE_OPTIONS='--openssl-legacy-provider' npx expo export:web
```