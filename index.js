const fetch = require('node-fetch');
const FormData = require('form-data');
const readline = require('readline');
const nconf = require('nconf');

let settings = {};

nconf.use('file', { file: __dirname + '/nest-config.json' });
nconf.load();

function setConfig(config) {
	settings = config;
}

function reset() {
	nconf.set('pin', null);
	nconf.save();
}

function checkSetting(settingName) {
	if (settings[settingName] === null || settings[settingName] === undefined || settings[settingName].length === 0) {
		throw `Please set the ${settingName} setting first.`;
	}
}

function getPin(callback) {
	checkSetting('productId');
	let authUrl = 'https://home.nest.com/login/oauth2?client_id=' + settings.productId + '&state=STATE';
	let pin = nconf.get('pin') || null;

	if (pin === null) {
		// Do the auth stuff
		let rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		console.log("Visit this URL in your browser and sign in. Enter the PIN it gives you here.");
		console.log("");
		console.log(authUrl);
		console.log("");
		rl.question('> ', (pin) => {
			nconf.set('pin', pin);
			nconf.save();
			rl.close();
			callback(pin);
		});
	} else {
		callback(pin);
	}
}

function getAccessToken(callback) {
	let code = nconf.get('access_token');
	if (code) {
		callback(code);
	} else {
		checkSetting('productId');
		checkSetting('productSecret');

		// Get PIN and then use that to get the access_token
		getPin((pin) => {

			let form = "";
			form += 'client_id=' + settings.productId;
			form += '&client_secret=' + settings.productSecret;
			form += '&code=' + pin;
			form += '&grant_type=authorization_code';

			let options = {
				method: 'POST',
				body: form,
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
			}

			fetch('https://api.home.nest.com/oauth2/access_token', options)
			.then(res => res.json())
			.then(auth => {
				nconf.set('access_token', auth.access_token);
				nconf.save();

				callback(auth.access_token);

			})
			.catch(err => {
				console.log("Error!");
				console.log(err);
			});
		});
	}
}

function listCameras(callback) {
	getAccessToken(token => {
		let options = {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
			}
		}

		fetch('https://developer-api.nest.com/devices', options)
		.then(res => res.json())
		.then(result => result.cameras)
		.then(cameras => {
			let cams = [];
			Object.keys(cameras).forEach((key, index) => {
			cams.push(cameras[key]);
		});

		if (callback) {
			callback(cams);
		}
	})
	.catch(err => {
		console.log(err);
	});
});
}

function setCamera(onOff, deviceIds, callback) {
	if (!deviceIds || deviceIds.length === 0) {
		console.log("No deviceId specified.");
		return;
	}
	getAccessToken(token => {
		let options = {
			method: 'PUT',
			body: JSON.stringify({ 'is_streaming': onOff }),
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
			}
		}

		if (typeof(deviceIds) === "string") {
			deviceIds = deviceIds.split();
		}

		deviceIds.forEach(id => {
			fetch('https://developer-api.nest.com/devices/cameras/' + id, options)
			.then(result => {
				if (callback) {
					callback();
				}
			})
			.catch(err => {
				console.log("Error!");
				console.log(err);
			});
		});
	});
}

function setAllCameras(onOff, callback) {
	getAccessToken(token => {
		let options = {
			method: 'PUT',
			body: JSON.stringify({ 'is_streaming': onOff }),
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
			}
		}

		listCameras(cams => {
			let ids = cams.map(cam => cam.device_id);
			// TODO: callback runs for each camera. Maybe it should just run once after they're all set.
			setCamera(onOff, ids, callback);
		});
	});
}



let nestExports = {
	setConfig,
	reset,
	listCameras,
	setCamera,
	setAllCameras
}

module.exports = nestExports;

