const Jaxcore = require('jaxcore');
const jaxcore = new Jaxcore();

// PLUGINS
jaxcore.addPlugin(require('jaxcore-spin'));
// jaxcore.addPlugin(require('jaxcore-websocket-plugin/websocket-server'));
jaxcore.addPlugin(require('../../websocket-server'));

jaxcore.defineService('websocketserver-localhost:37524', 'websocketServer', {
	host: 'localhost',
	port: 37524,	// the port that the "jaxcore browser extension" will connect to
	allowClients: ['::1', '::ffff:127.0.0.1', '127.0.0.1'],   // only allow clients to connect from localhost or 127.0.0.1
	options: {
		allowUpgrades: true,
		transports: [ 'polling', 'websocket' ]
	}
});

jaxcore.defineAdapter('Spin Browser', {
	adapterType: 'websocketServer',
	deviceType: 'spin',
	serviceProfiles: ['websocketserver-localhost:37524']
});

jaxcore.on('spin-connected', function(spin) {
	console.log('connected', spin.id);
	
	jaxcore.connectAdapter(spin, 'Spin Browser', function(err, adapterInstance, adapterConfig, didCreate) {
		console.log('adapter ' + (didCreate ? 'launched' : 'relaunched'), adapterConfig);
		console.log('websocketServer settings', adapterConfig.profile.services.websocketServer);
		
		// adapterInstance.on('teardown', function () {
		// 	console.log('adapter is destroying', adapterConfig);
		// 	// process.exit();
		// });
	});
	
	// jaxcore.launchAdapter(spin, 'websocketServer', {
	// 	services: {
	// 		websocketServer: {
	// 			host: 'localhost',
	// 			port: 37524,	// the port that the "jaxcore browser extension" will connect to
	// 			allowClients: ['::1', '::ffff:127.0.0.1', '127.0.0.1'],   // only allow clients to connect from localhost or 127.0.0.1
	// 			options: {
	// 				allowUpgrades: true,
	// 				transports: [ 'polling', 'websocket' ]
	// 			}
	// 		}
	// 	}
	// });
});

jaxcore.startDevice('spin');

jaxcore.startServiceProfile('websocketserver-localhost:37524', function(err, service) {
	console.log('websocket', service);
});
