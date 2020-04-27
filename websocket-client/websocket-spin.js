const {Client, createLogger, createClientStore} = require('jaxcore');
// const {createLogger} = require('../../lib/logger');
// const Client = require('../../lib/client');
// const Store = require('../../lib/store');
// const {createClientStore} = Store;
// const {createLogger} = require('../../lib/logger');

const SpinBuffer = require('./spin-buffer');
const EventEmitter = require('events');
const spinMonitor = new EventEmitter();

const log = createLogger('WebsocketSpin');

const spinIds = {};
let _instance = 0;

const schema = {
	id: {
		type: 'string'
	},
	instance: {
		type: 'number'
	},
	connected: {
		type: 'boolean'
	},
	spinPosition: {
		type: 'number'
	},
	spinPreviousTime: {
		type: 'date'
	},
	spinTime: {
		type: 'number'
	},
	knobPushed: {
		type: 'boolean'
	},
	knobPushTime: {
		type: 'date'
	},
	knobReleaseTime: {
		type: 'date'
	},
	knobHold: {
		type: 'boolean'
	},
	buttonPushed: {
		type: 'boolean'
	},
	buttonPushTime: {
		type: 'date'
	},
	buttonReleaseTime: {
		type: 'date'
	},
	buttonHold: {
		type: 'boolean'
	},
	batteryVoltage: {
		type: 'number'
	},
	batteryPercent: {
		type: 'number'
	},
	isCharging: {
		type: 'boolean'
	},
	isCharged: {
		type: 'boolean'
	},
	sleeping: {
		type: 'boolean'
	},
	brightness: {
		type: 'number',
		defaultValue: 16
	},
	knobHoldThreshold: {
		type: 'number',
		defaultValue: 2000
	},
	buttonHoldThreshold: {
		type: 'number',
		defaultValue: 2000
	},
	sleepEnabled: {
		type: 'boolean',
		defaultValue: true
	},
	sleepTimer: {
		type: 'number',
		defaultValue: 120
	}
};

let spinStore;

class WebsocketSpin extends Client {
	constructor(device, store) {
		let instance = (_instance++);
		
		if (!store) {
			if (!spinStore) spinStore = createClientStore('TSpin');
			store = spinStore;
		}
		
		const defaults = {
			id: device.id,
			instance: instance,
		};
		
		super(schema, store, defaults);
		
		this.deviceType = 'spin';
		
		this.log = createLogger('TransportSpin ' + instance);
		
		let id = device.id;
		
		// if (typeof id !== 'string') {
		// 	debugger;
		// 	return;
		// }
		
		this.log('set id', id);
		spinIds[id] = this;
		
		this.id = id;
		
		if (device.transport) {
			this.transport = device.transport;
		}
		
		this._rotationIndex = 8192;
		
		this._bufferDiff = new SpinBuffer(this);
	}
	
	buffer(diff, kineticBufferLimit, staticBufferLimit, momentumTimeout, momentumBuffer) {
		return this._bufferDiff.buffer(diff, kineticBufferLimit, staticBufferLimit, momentumTimeout, momentumBuffer);
	}
	
	delay(ms) {
		this._bufferDiff.delay(ms);
	}
	
	cancelHoldEvents() {
		clearTimeout(this._knobHoldTimer);
		clearTimeout(this._buttonHoldTimer);
	}
	
	isConnected() {
		return this.state.connected;
	}
	
	connect() {
		this.resetDefaults({
			connected: true,
			sleeping: false
		});
		this.emit('connect', this);
	}
	
	_removeEvents() {
		this.transport.disconnectSpin(this);
	}
	
	disconnect() {
		this.resetDefaults({
			connected: false
		});
		this.emit('disconnect', this);
	}
	
	resetDefaults(c) {
		const d = {
			spinPosition: 0,
			knobPushed: false,
			knobReleased: true,
			buttonPushed: false,
			buttonReleased: true
		};
		if (c) {
			for (let i in c) {
				d[i] = c[i];
			}
		}
		return d;
	}
	
	sendCommand() { // method, arg1, arg2, arg3...
		let args = Array.prototype.slice.call(arguments);
		args.unshift(this.id);
		this.log('sendCommand', args);
		this.transport.sendCommand(this, args);
	}
	
	orbit(direction, speed, color1, color2) {
		// this.log('client orbit(', direction, speed, color1, color2);
		this.sendCommand('ORBIT', direction, speed, color1, color2);
	}
	
	flash(color) {
		this.sendCommand('FLASH', color);
	}
	
	quickFlash(color, repeat) {
		if (!repeat) repeat = 1;
		this.sendCommand('QUICKFLASH', color.join(',') + ',' + repeat);
	}
	
	lightsOn(color) {
		this.sendCommand('LIGHTSON', color);
	}
	
	lightsOff() {
		this.sendCommand('LIGHTSOFF');
	}
	
	setBrightness(brightness) {
		this.sendCommand('BRIGHTNESS', brightness);
	}
	
	rainbow(rotations) {
		this.sendCommand('RAINBOW', rotations);
	}
	
	rotate(diff, color1, color2) {
		// this._rotationIndex += diff;
		// if (this._rotationIndex <= 0 || this._rotationIndex >= 16384) this._rotationIndex = 8192;
		// this.sendCommand('ROTATE', [this._rotationIndex, color1[0], color1[1], color1[2], color2[0], color2[1], color2[2]]);
		// this.sendCommand('ROTATE', [this._rotationIndex, color1[0], color1[1], color1[2], color2[0], color2[1], color2[2]]);
		this.sendCommand('ROTATE', diff, color1, color2);
	}
	
	scale(scalePercent, color1, color2, color3) {
		if (scalePercent < 0) scalePercent = 0;
		if (scalePercent > 1) scalePercent = 1;
		var scaleIndex = Math.round(scalePercent * 25);
		this.sendCommand('SCALAR', [scaleIndex, color1[0], color1[1], color1[2], color2[0], color2[1], color2[2], color3[0], color3[1], color3[2]]);
	}
	
	// scale (percent, color1, color2, color3) {
	// 	this.sendCommand('SCALAR', percent, color1, color2, color3);
	// }
	
	dial(scalePercent, color1, color2, color3) {
		if (scalePercent < 0) scalePercent = 0;
		if (scalePercent > 1) scalePercent = 1;
		var scaleIndex = Math.round(scalePercent * 25);
		log('dial', scaleIndex, color1[0], color1[1], color1[2], color2[0], color2[1], color2[2], color3[0], color3[1], color3[2]);
		this.sendCommand('DIAL', [scaleIndex, color1[0], color1[1], color1[2], color2[0], color2[1], color2[2], color3[0], color3[1], color3[2]]);
	}
	
	orbit(direction, speed, color1, color2) {
		if (this.bleDevice) this.bleDevice.orbit(direction, speed, color1, color2);
		else this.sendCommand('ORBIT', [direction === 1 ? 1 : 0, speed, color1[0], color1[1], color1[2], color2[0], color2[1], color2[2]]);
	}
	
	
	balance(balancePercent, color1, color2, color3) {
		var balanceIndex;
		if (balancePercent === 0) balanceIndex = 24;
		else if (balancePercent < 0) balanceIndex = 23 - Math.round(Math.abs(balancePercent) * 23);
		else balanceIndex = 24 + Math.round(balancePercent * 23);
		log('balancePercent', balancePercent, 'balanceIndex=' + balanceIndex);
		this.sendCommand('BALANCE', [balanceIndex, color1[0], color1[1], color1[2], color2[0], color2[1], color2[2], color3[0], color3[1], color3[2]]);
	}
	
	startTimer(ms, color1, color2) {
		this.sendCommand('TIMER', [ms, color1[0], color1[1], color1[2], color2[0], color2[1], color2[2]]);
	}
	
	cancelTimer() {
		this.sendCommand('TIMER', [0]);
	}
	
	setKnobHoldThreshold(th) {
		this.setState({knobHoldThreshold: th});
	}

	processKnob(pushed) {
		var me = this;
		var changes = {};
		changes.knobPushed = pushed;
		changes.knobReleased = !pushed;
		if (pushed) {
			changes.knobPushTime = new Date().getTime();
			this.setState(changes);

			this._bufferDiff.reset();

			clearTimeout(this._knobHoldTimer);
			this._knobHoldTimer = setTimeout(function () {
				me.log('knobHoldThreshold exceeded');
				me.setState({
					knobHold: true
				});
				me.emit('knob-hold');
			}, this.state.knobHoldThreshold);
		}
		else {
			var wasHeld = this.state.knobHold;
			if (wasHeld) {
				changes.knobHold = false;
				// this.log('knob was held, cancelling presses');
			}
			changes.knobReleaseTime = new Date().getTime();
			clearTimeout(this._knobHoldTimer);
			this.setState(changes);
		}
		this.emit('knob', pushed);
	}
	
	setButtonHoldThreshold(th) {
		this.setState({buttonHoldThreshold: th});
	}

	processButton(pushed) {
		var me = this;
		var changes = {};
		changes.buttonPushed = pushed;

		var now = new Date().getTime();
		if (pushed) {
			changes.buttonPushTime = now;
			clearTimeout(this._buttonHoldTimer);
			this._buttonHoldTimer = setTimeout(function () {
				me.log('buttonHoldThreshold exceeded');
				changes.buttonHold = true;
				me.emit('button-hold');
			}, this.state.buttonHoldThreshold);
		}
		else {
			var wasHeld = this.state.buttonHold;
			if (wasHeld) {
				changes.buttonHold = false;
				this.log('button was held, cancelling presses');
			}
			clearTimeout(this._buttonHoldTimer);
		}
		this.setState(changes);
		this.emit('button', pushed);
	}

	processCommand(a,b) {
		console.log('NOT IMPLEMENTED ws spin.processCommand', a, b);
	}
	
	destroy() {
		this.disconnect();
		this.log('destroying');
		this._removeEvents();
		delete this.state;
		let id = this.id;
		delete spinIds[id];
	}
	
	static destroySpin(id) {
		WebsocketSpin.spinIds[id].destroy();
	}
	
	static onSpinConnected(id) {
		let spin = WebsocketSpin.spinIds[id];
		// spin.state.connected = true;
		spin.setState({connected: true});
		// console.log('onSpinConnected', id);
		
		// process.exit();
		
		if (spin) {
			console.log('spinMonitor emit spin-connected', id, spin.state.connected);
			// process.exit();
			spinMonitor.emit('spin-connected', spin);
		}
	}
	static onSpinDisconnected(id) {
		let spin = WebsocketSpin.spinIds[id];
		if (spin) spinMonitor.emit('spin-disconnected', spin);
	}
	
	static connect(callback) {
		//console.log('spinMonitor waiting for on spin-connected');
		spinMonitor.on('spin-connected', callback);
	}
	
	static startJaxcoreDevice(ids, deviceStore, callback) {
		// console.log('WebsocketSpin startJaxcoreDevice', deviceStore);
		WebsocketSpin.connect(function(spin) {
			// console.log('WebsocketSpin connected', spin.id);
			callback(spin);
		});
	}
}

WebsocketSpin.spinIds = spinIds;

global.WebsocketSpin = WebsocketSpin;

module.exports = WebsocketSpin;