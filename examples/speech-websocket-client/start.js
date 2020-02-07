const Jaxcore = require('jaxcore');
const jaxcore = new Jaxcore();
// jaxcore.addPlugin(require('jaxcore-spin'));
// jaxcore.addPlugin(require('jaxcore-websocket-plugin/websocket-client'));
jaxcore.addPlugin(require('../../websocket-client'));

// the host and port must match the websocket-server settings in start-node-server.js
const WEBSOCKET_HOST = 'localhost';
const WEBSOCKET_PORT = 37500;

jaxcore.on('service-disconnected', (type, device) => {
	if (type === 'websocketClient') {
		console.log('websocket service-disconnected', type, device.id);
		connectSocket();
	}
});

jaxcore.on('service-connected', (type, service) => {
	console.log('service-connected', type, service.id);
	if (type === 'websocketClient') {
		let websocketClient = service;
		// websocketClient.on('disconnect', () => {  todo: doesn't disconnect
		// 	console.log('websocket disconnected');
		// });
		// websocketClient.on('speech-recognize', (text) => {
		// 	console.log('speech-recognize', text);
		// });
	}
});

function connectSocket() {
	jaxcore.connectWebsocket({
		protocol: 'http',
		host: WEBSOCKET_HOST,
		port: WEBSOCKET_PORT,
		options: {
			reconnection: true
		}
	}, function (err, websocketClient) {
		if (err) {
			console.log('websocketClient error', err);
			process.exit();
		}
		else if (websocketClient) {
			console.log('websocketClient connected');
		}
	});
}

jaxcore.on('device-connected', function(type, device) {
	console.log('device-connected', type, device);
	
	if (type === 'speech') {
		const speech = device;
		// speech.on('disconnect', function() {  // todo: doesn't disconnect
		// 	console.log('SPEECH disconnect');
		// 	process.exit();
		// });
		speech.on('recognize', function(text) {
			console.log('Recognize:', text);
		});
		console.log('speech device', device);
	}
	if (type === 'websocketSpin') {
		const spin = device;
		console.log('connected', spin);
		// jaxcore.connectAdapter(spin, 'Basic Spin');
	}
	else {
		console.log('device-connected', type);
		// process.exit();
	}
});

connectSocket();
