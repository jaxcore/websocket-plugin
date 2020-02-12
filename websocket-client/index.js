module.exports = {
	devices: {
		websocketSpin: {
			device: require('./websocket-spin'),
			storeType: 'client'
		},
		speech: {
			device: require('./websocket-speech-device'),
			storeType: 'service'
		}
	},
	services: {
		websocketClient: {
			service: require('./websocket-client'),
			storeType: 'client'
		}
	}
};
