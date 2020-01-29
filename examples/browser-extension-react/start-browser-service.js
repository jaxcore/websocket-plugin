const Jaxcore = require('jaxcore');
const jaxcore = new Jaxcore();

// PLUGINS
jaxcore.addPlugin(require('jaxcore-spin'));
jaxcore.addPlugin(require('jaxcore-websocket-plugin/websocket-server'));

jaxcore.on('spin-connected', function(spin) {
	console.log('connected', spin.id);
	
	jaxcore.launchAdapter(spin, 'websocketServer', {
		services: {
			websocketServer: {
				host: 'localhost',
				port: 37524,	// the port that the "jaxcore browser extension" will connect to
				allowClients: ['::1', '::ffff:127.0.0.1', '127.0.0.1'],   // only allow clients to connect from localhost or 127.0.0.1
				options: {
					allowUpgrades: true,
					transports: [ 'polling', 'websocket' ]
				}
			}
		}
	});
});

jaxcore.startDevice('spin');
