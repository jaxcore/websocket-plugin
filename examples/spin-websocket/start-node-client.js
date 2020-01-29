const Jaxcore = require('jaxcore');
const jaxcore = new Jaxcore();
jaxcore.addPlugin(require('jaxcore-spin'));
jaxcore.addPlugin(require('jaxcore-websocket-plugin/websocket-client'));

jaxcore.addAdapter('basic-spin-adapter', require('jaxcore/adapters/basic-spin-adapter'));

jaxcore.defineAdapter('Basic Spin', {
	adapterType: 'basic-spin-adapter',
	deviceType: 'spin'
});

// the host and port must match the websocket-server settings in start-node-server.js
const WEBSOCKET_HOST = 'localhost';
const WEBSOCKET_PORT = 37500;

jaxcore.on('service-disconnected', (type, device) => {
	if (type === 'websocketClient') {
		console.log('websocket service-disconnected', type, device.id);
		connectSocket();
	}
});

jaxcore.on('service-connected', (type, device) => {
	console.log('service-connected', type, device.id);
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
	if (type === 'websocketSpin') {
		const spin = device;
		console.log('connected', spin);
		jaxcore.connectAdapter(spin, 'Basic Spin');
	}
	else {
		console.log('device-connected', type);
		process.exit();
	}
});

connectSocket();