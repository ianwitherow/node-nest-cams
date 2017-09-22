# node-nest-cams
Simple node module for controlling Nest cameras. Currently, you can list cameras and turn them on or off.

[![NPM](https://nodei.co/npm/node-nest-cams.png?compact=true)](https://npmjs.org/package/node-nest-cams)

## Install
`npm install node-nest-cams`

## Getting Started
You'll need to register a product with Nest from their developers site. Instructions here: [https://developers.nest.com/documentation/cloud/register-client]https://developers.nest.com/documentation/cloud/register-client

Make sure it has read/write permissions for Camera

Once this is set up, you'll set the Product ID and Product Secret in the config as shown below.

## Usage and Examples

```
const nest = require('node-nest-cams');

let nestConfig = {
	productId: 'xxxxxx',
	productSecret: 'xxxxxx'
}

nest.setConfig(nestConfig);

// List cameras (for example, if you want to get a specific camera's ID)
nest.listCameras((cameras) => {

	// Find a specific camera
	let livingRoomCamera = cameras.find((camera) => camera.name === "Living Room");

	/* You need the 'device_id' of the camera to do stuff with it */
	
	// Call nest.setCamera with true/false to turn camera(s) on/off respectively:
	nest.setCamera(false, livingRoomCamera.device_id, (err) => {
		if (!err) {
			console.log("Living room camera is off!");
		}
	});

});

// If you want to just turn on/off ALL cameras, use:
nest.setAllCameras(false, (err) => {
	// This callback runs for each camera affected
	if (err) {
		console.log(err)
	}
});
```

On the first run, you'll be prompted to authorize the Nest app you created earlier. Follow the URL and enter the PIN.

Should anything go wrong and you need to start the authorization process over, just call `nest.reset()` in your app.
