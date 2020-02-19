const {Service, createLogger} = require('jaxcore');

const schema = {
	id: {
		type: 'string'
	},
	connected: {
		type: 'boolean'
	}
};

let speechInstance;

class WebsocketSpeechDevice extends Service {
	constructor(store) {
		const defaults = {
			id: 'speech'
		};
		
		super(schema, store, defaults);
		
		this.deviceType = 'speech';
		
		this.log = createLogger('WebsocketSpeechDevice');
	}
	
	connect() {
		this.setState({
			connected: true
		});
		this.emit('connect', this);
	}
	
	disconnect() {
		this.setState({
			connected: false
		});
		this.emit('disconnect', this);
	}
	
	speechRecognize(text, stats) {
		this.log('websocket-speech-device speechRecognize', text, stats);
		this.emit('recognize', text, stats);
	}
	
	destroy() {
		this.disconnect();
	}
	
	static connect(callback) {
		console.log('spinMonitor waiting for on spin-connected');
		// spinMonitor.on('spin-connected', callback);
	}
	
	static startJaxcoreDevice(config, deviceStore, callback) {
		if (speechInstance) {
			speechInstance.disconnect();
			speechInstance.removeAllListeners('recognize');
		}
		else {
			speechInstance = new WebsocketSpeechDevice(deviceStore);
		}
		callback(speechInstance);
		speechInstance.connect();
	}
	
	static getInstance() {
		return speechInstance;
	}
}

module.exports = WebsocketSpeechDevice;