const Jaxcore = require('jaxcore');
const jaxcore = new Jaxcore();
jaxcore.addPlugin(require('jaxcore-spin'));
// jaxcore.addPlugin(require('jaxcore-websocket-plugin/websocket-server'));
jaxcore.addPlugin(require('../../websocket-server'));

jaxcore.defineService('websocketserver-localhost:37500', 'websocketServer', {
	host: 'localhost',
	// host: '127.0.0.1', // <---- Listen on localhost
	// host: '192.168.1.29', // <---- Listen on specific IP address
	port: 37500,
	allowClients: ['::1', '::ffff:127.0.0.1', '127.0.0.1'],   // only allow clients to connect from localhost or 127.0.0.1
	// allowClients: ['192.168.1.29', '::ffff:192.168.1.29'], // only allow clients to connect from a specific IP address
	options: {
		allowUpgrades: true,
		transports: ['polling', 'websocket']
	}
});

jaxcore.defineAdapter('Spin Websocket', {
	adapterType: 'websocketServer',
	deviceType: 'spin',
	serviceProfiles: ['websocketserver-localhost:37500']
});

jaxcore.on('spin-connected', function (spin) {
	console.log('connected', spin.id);
	
	jaxcore.connectAdapter(spin, 'Spin Websocket', function(err, adapterInstance, adapterConfig, didCreate) {
		console.log('adapter ' + (didCreate ? 'launched' : 'relaunched'), adapterConfig);
		console.log('websocketServer settings', adapterConfig.profile.services.websocketServer);
		
		// adapterInstance.on('teardown', function () {
		// 	console.log('adapter is destroying', adapterConfig);
		// 	// process.exit();
		// });
	});
});

jaxcore.startDevice('spin');

jaxcore.startServiceProfile('websocketserver-localhost:37500', function(err, service) {
	console.log('websocket', service);
});
