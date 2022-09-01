# MRAT Server for Quest
# About
This repo is the web-end of MRAT-Passthrough that monitors user behavior. Currently, MRAT Server for Quest is connected to Firebase database and have the following features:
- Monitor user behavior on 2D planes lively.
- Add objects in the scene

# Setup
Clone this repo to your local computer.

## Firebase
Go to https://console.firebase.google.com/. In your project overview menu, click *Add app*. Then select *web*. Complete the registration and your should be able to obtain some configuration code. Here is an example configuration code:
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyAwDcSoSqko3I6uxszuLtcDnCvoIGH6vbA",
    authDomain: "mrat-passthrough-f5e34.firebaseapp.com",
    databaseURL: "https://mrat-passthrough-f5e34-default-rtdb.firebaseio.com",
    projectId: "mrat-passthrough-f5e34",
    storageBucket: "mrat-passthrough-f5e34.appspot.com",
    messagingSenderId: "447706271029",
    appId: "1:447706271029:web:eb9a55ca8903d552e0d07c",
    measurementId: "G-JF0P7XM5R7"
  };
```
Then substitude the configuration code to `./js/dashboard.js`.

## Scene
A sample scene setup is placed in `./json/scene.json`. The scene is to simulate objects that exists in your Unity project you want to test with. Every item in `scene.json` must have property `x` and `y`. You can chose to add `name`, `width`, and `height`.

## Start the server
Run `http-server` in command line and go to the address shown on it. If the server need to be accessed on other devices, please change the `server_address` in `./js/dashboard.js`.