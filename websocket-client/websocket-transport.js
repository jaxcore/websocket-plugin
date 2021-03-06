const EventEmitter = require('events');
// const {createLogger} = require('../../lib/logger');
const {createLogger} = require('jaxcore');
const log = createLogger('WebsocketTransport');

class WebsocketTransport extends EventEmitter {
	constructor(WebsocketSpin, spinStore) {
		super();
		this.WebsocketSpin = WebsocketSpin;
		this.spinStore = spinStore;
		global.transport = this;
	}
	
	createSpin(id, state) {
		if (id in this.WebsocketSpin.spinIds) {
			// return spinIds[id];
		}
		else {
			if (state && state.connected) state.connected = false;
			// debugger;
			// state.connected = true;
			log('WebsocketSpin.createSpin', typeof id, id, typeof state, state);
			
			let device = {
				transport: this,
				id
			};
			console.log('createSpin', id);
			if (typeof id !== 'string') {
				debugger;
				return;
			}
			
			let spin = new this.WebsocketSpin(device, this.spinStore, state);
			spin.connect();
			// spin.state.connected = true;
			return spin;
		}
	}
	
	connectSpin(id, state) {
		console.log('connectSpin', id, state);
		// if (typeof id !== 'string') {
		// 	debugger;
		// 	return;
		// }
		if (state && state.connected) state.connected = false;
		
		if (id in this.WebsocketSpin.spinIds) {
			log('WebsocketSpin.connectSpin', id, state);
			
			let spin = this.WebsocketSpin.spinIds[id];
			spin.setState(state);
			return spin;
		}
		else {
			log('connectSpin CREATING', id, state);
			// debugger;
			let spin = this.createSpin(id, state);
			// spin.connect();
			return spin;
		}
	}
	
	updateSpin(id, changes) {
		if (!changes) {
			log('no changes?');
			return;
		}
		
		if (id in this.WebsocketSpin.spinIds) {
			// log('SPIN UPDATING', id, changes);
			
			let spin = this.WebsocketSpin.spinIds[id];
			spin.setState(changes);
			if ('knobPushed' in changes) {
				// log('emit knob', changes.knobPushed);
				// spin.emit('knob', changes.knobPushed);
				spin.processKnob(changes.knobPushed);
			}
			if ('buttonPushed' in changes) {
				// log('emit button pushed', spin.state.id, changes.buttonPushed);
				// log('emit button', changes.buttonPushed);
				// spin.emit('button', changes.buttonPushed);
				spin.processButton(changes.buttonPushed);
			}
			
			if ('spinPosition' in changes) {
				let previousSpinPosition;
				if ('previousSpinPosition' in changes) previousSpinPosition = changes.previousSpinPosition;
				else previousSpinPosition = spin.state.previousSpinPosition;
				
				let previousSpinTime;
				if ('previousSpinTime' in changes) previousSpinTime = changes.previousSpinTime;
				else previousSpinTime = spin.state.previousSpinTime;
				
				let diff = spin.state.spinPosition - previousSpinPosition;
				let time = spin.state.spinTime - previousSpinTime;
				if (!isNaN(diff)) {
					log('emit spin', diff, time);
					let direction = diff > 0 ? 1 : -1;
					spin.emit('spin', diff, time, direction);
				}
				else {
					log('ERROR: DIFF IS NAN', diff);
				}
			}
			
			// if ('knobHold' in changes) {
			// 	log('emit knob', changes.knobHold);
			// 	spin.emit('knob-hold', changes.knobHold);
			// }
			// if ('buttonHold' in changes) {
			// 	log('emit button', changes.buttonHold);
			// 	process.exit();
			// 	spin.emit('button-hold', changes.buttonHold);
			// }
			
			if ('connected' in changes) {
				debugger;
				if (changes.connected) {
					this.emit('spin-connected', spin);
					spin.emit('connect');
				}
				else {
					this.emit('spin-disconnected', spin);
					spin.emit('disconnect');
				}
			}
			
			return spin;
		}
		else {
			log('updateSpin CREATING', id, changes);
			// debugger;
			return this.createSpin(id, changes);
		}
		
	}
	
	disconnectSpin(id, changes) {
		log('disconnectSpin', id, changes);
		if (id in this.WebsocketSpin.spinIds) {
			let spin = this.WebsocketSpin.spinIds[id];
			// if (!changes) changes = {};
			// changes.connected = false;
			// spin.setState(changes);
			// spin.emit('disconnect');
			spin.disconnect();
			
			this.emit('spin-disconnected', spin);
		}
		else {
			console.log('invalid id', id, this.WebsocketSpin.spinIds);
		}
	}
	
	// update(id, changes) {
	// 	log('transport update', id, changes);
	// 	debugger;
		//
		// var spin = this.WebsocketSpin.spinIds[id];
		//
		// for (let c in changes) {
		// 	spin.state[c] = changes[c];
		// }
		//
		// // log('update changed', changed);
		//
		// if ('knobPushed' in changes) {
		// 	spin.emit('knob', changes.knobPushed);
		// }
		// if ('buttonPushed' in changes) {
		// 	// log('emit button pushed', spin.state.id, changes.buttonPushed);
		// 	spin.emit('button', changes.buttonPushed);
		// }
		// if ('spinPosition' in changes) {
		// 	spin._lastSpinPosition = spin.state.spinPosition;
		// 	let direction = diff > 0 ? 1 : -1;
		// 	spin.emit('spin', spin.state.spinDirection, spin.state.spinPosition);
		// }
		//
		// if ('connected' in changes) {
		// 	if (changes.connected) {
		// 		this.emit('spin-connected', spin);
		// 		spin.emit('connect');
		// 	}
		// 	else {
		// 		this.emit('spin-disconnected', spin);
		// 		spin.emit('disconnect');
		// 	}
		// }
		//
		// log('update', changes);
		// spin.emit('update', changes);
	// }
	
	sendCommand(spin, args) {
		log('WebsocketTransport sendCommand', args);
		
		let id = args.shift();
		let method = args.shift();
		// this.emit('spin-command', id, method, args);
		
		log('emit spin-command-'+id, method, args);
		
		// debugger;
		this.emit('spin-command-'+id, id, method, args);
	}
	
	socketConnected(socket) {
		this.socket = socket;
		
	}
	
	socketDisconnected(socket) {
		console.log('disconnect all', this.WebsocketSpin.spinIds);
		// debugger;
		for (let id in this.WebsocketSpin.spinIds) {
			// if (this.WebsocketSpin.spinIds[id].connected) {
				this.disconnectSpin(id);
			// }
		}
		this.socket = null;
	}
}

module.exports = WebsocketTransport;