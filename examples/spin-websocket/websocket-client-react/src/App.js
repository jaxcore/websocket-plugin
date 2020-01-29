import React, {Component} from 'react';

const Jaxcore = require('jaxcore');
const jaxcore = new Jaxcore();

jaxcore.addPlugin(require('jaxcore-websocket-plugin/websocket-client'));
jaxcore.addAdapter('basic-spin-adapter', require('jaxcore/adapters/basic-spin-adapter'));

const websocketClientConfig = {
	host: 'localhost',
	port: 37500,
	protocol: 'http',
	options: {
		reconnection: true
	}
};

function connectSocket() {
	jaxcore.connectWebsocket(websocketClientConfig, function (err, websocketClient) {
		console.log('websocketClient connected', websocketClient);
	});
}

class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			loading: true,
			spins: [],
			updates: []
		}
	}
	
	componentDidMount() {
		jaxcore.on('service-disconnected', (type, device) => {
			if (type === 'websocketClient') {
				this.setState({
					serverConnected: false,
					serverId: null
				});
				console.log('service-disconnected', type, device.id, 'reconnecting...');
				debugger;
				connectSocket();
			}
		});
		
		jaxcore.on('service-connected', (type, device) => {
			if (type === 'websocketClient') {
				console.log('service-connected', type, device.id);
				this.setState({
					loading: false,
					serverConnected: true,
					serverId: device.id
				});
			}
		});
		
		jaxcore.on('device-connected', (type, device) => {
			const spin = device;
			console.log('connected', spin);
			
			const {spins} = this.state;
			spins.push(spin.id);
			this.setState({
				spins
			});
			
			spin.on('spin', (diff, time) => {
				const {updates} = this.state;
				updates.unshift('spin ' + diff);
				if (updates.length > 50) updates.length = 50;
				this.setState({updates});
			});
			spin.on('knob', (pushed) => {
				const {updates} = this.state;
				updates.unshift('knob ' + pushed);
				if (updates.length > 50) updates.length = 50;
				this.setState({updates});
			});
			spin.on('button', (pushed) => {
				const {updates} = this.state;
				updates.unshift('button ' + pushed);
				if (updates.length > 50) updates.length = 50;
				this.setState({updates});
			});
			
			spin.on('disconnect', () => {
				spin.removeAllListeners();
				
				const {spins} = this.state;
				let i = spins.indexOf(spin.id);
				spins.splice(i, 1);
				this.setState({
					spins
				});
			});
			
			jaxcore.createAdapter(spin, 'basic-spin-adapter');
		});
		
		connectSocket();
	}
	
	render() {
		return (
			<div>
				<h4>Websocket Server:</h4>
				{this.renderServer()}
				<h4>Spins Connected:</h4>
				{this.renderSpins()}
				<h4>Spin Updates:</h4>
				{this.renderUpdates()}
			</div>
		);
	}
	
	renderServer() {
		if (this.state.serverConnected) {
			return (<div>Connected {this.state.serverId}</div>);
		}
		else {
			return (<div>Connecting...</div>);
		}
	}
	
	renderSpins() {
		return this.state.spins.map((id, i) => {
			return (<div key={i}>{id}</div>);
		});
	}

	renderUpdates() {
		return this.state.updates.map((id, i) => {
			return (<div key={i}>{id}</div>);
		});
	}
	
}

export default App;
