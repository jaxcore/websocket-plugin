import React, {Component} from 'react';

const Jaxcore = require('jaxcore');
const jaxcore = new Jaxcore();
global.jaxcore = jaxcore;

window.isWebpage = true;

jaxcore.addPlugin(require('jaxcore-websocket-plugin/websocket-client'));
jaxcore.addPlugin(require('jaxcore-websocket-plugin/browser-service'));
// jaxcore.addAdapter('basic-spin-adapter', require('jaxcore/adapters/basic-spin-adapter'));

function connectBrowser() {
	jaxcore.connectBrowserExtension(function (err, browserAdapter) {
		console.log('websocketClient connected', browserAdapter);
	});
}

class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			loading: true,
			extensionReady: false,
			extensionConnected: false,
			websocketConnected: false,
			browserServiceId: null,
			portConnected: false,
			tabActive: false,
			spins: [],
			updates: [],
			spokenList: []
		}
	}
	
	componentDidMount() {
		jaxcore.on('service-disconnected', (type, device) => {
			if (type === 'browserService') {
				this.setState({
					extensionReady: false,
					extensionConnected: false,
					browserServiceId: null
				});
				// console.log('browserService disconnected', type, device.id, 'reconnecting...');
				connectBrowser();
			}
		});
		
		jaxcore.on('service-connected', (type, device) => {
			if (type === 'browserService') {
				
				const browserService = device;
				
				browserService.on('extension-connected', (msg) => {
					// console.log('extension-connected !!!!', msg);
					// debugger;
					this.setState({
						extensionConnected: msg.extensionConnected,
						tabActive: msg.tabActive,
						grantedPrivileges: msg.grantedPrivileges,
						websocketConnected: msg.websocketConnected
					});
				});
				
				browserService.on('websocket-connected', (websocketConnected) => {
					// console.log('App browserService on websocketConnected', websocketConnected);
					this.setState({
						websocketConnected
					});
				});
				
				
				browserService.on('port-active', (portActive) => {
					this.setState({
						tabActive: portActive
					});
				});
				
				this.setState({
					extensionReady: true,
					extensionConnected: false,
					tabActive: false,
					browserServiceId: device.id
				});
				
				// console.log('browserService connected', type, device.id);
			}
		});
		
		jaxcore.on('device-connected', (type, device) => {
			
			if (type === 'speech') {
				const speech = device;
				
				speech.on('recognize', (text, stats) => {
					// debugger;
					console.log('page recognize', text, stats);
					const spokenList = this.state.spokenList;
					spokenList.unshift(text);
					if (spokenList.length > 10) spokenList.length = 10;
					this.setState({spokenList});
				});
			}
			
			if (type === 'websocketSpin') {  // todo: change to spin/
				const spin = device;
				console.log('connected websocket spin', spin.id);
				
				const {spins} = this.state;
				spins.push(spin.id);
				this.setState({
					spins
				});
				
				spin.on('spin', (diff, time) => {
					this.updateDisplay(spin.id, 'spin', diff);
					let dir = diff>0? 1:-1;
					spin.rotate(dir, [0, 0, 255], [255, 0, 0]);
				});
				spin.on('knob', (pushed) => {
					this.updateDisplay(spin.id, 'knob', pushed);
					if (pushed) spin.flash([255, 0, 0]);
				});
				spin.on('button', (pushed) => {
					this.updateDisplay(spin.id, 'button', pushed);
					if (pushed) spin.flash([0, 0, 255]);
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
				
				// jaxcore.createAdapter(spin, 'basic-spin-adapter');
			}
		});
		
		connectBrowser();
	}
	
	updateDisplay(id, type, data) {
		const {updates} = this.state;
		id = id.substring(0, 8);
		updates.unshift(id + ': ' + type + ' ' + data);
		if (updates.length > 50) updates.length = 50;
		this.setState({updates});
	}
	
	render() {
		return (
			<div>
				<h4>Browser Extension:</h4>
				{this.renderBrowserExtension()}
				
				<h4>Speech Recognition:</h4>
				<ul>
					{this.state.spokenList.map((text,index) => {
						return (<li key={index}>{text}</li>);
					})}
				</ul>
				
				<h4>Spins Connected:</h4>
				{this.renderSpins()}
				<h4>Spin Updates:</h4>
				{this.renderUpdates()}
			</div>
		);
	}
	
	renderBrowserExtension() {
		return (<div>
			<div>Extension: {this.state.extensionConnected ? this.state.browserServiceId + ' Connected' : 'Disconnected'}</div>
			<div>WebSocket: {this.state.websocketConnected ? 'Connected' : 'Disconnected'}</div>
			<div>Tab: {this.state.tabActive ? 'Active' : 'Inactive'}</div>
		</div>);
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
