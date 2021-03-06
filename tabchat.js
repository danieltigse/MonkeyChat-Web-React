import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import MonkeyUI from './components/MonkeyUI.js'
import Monkey from 'monkey-sdk'
import { isConversationGroup } from './utils/monkey-utils.js'
import * as vars from './utils/monkey-const.js'

import { createStore } from 'redux'
import reducer from './reducers'
const store = createStore(reducer, { conversations: {}, users: {} });

import * as actions from './actions'
import dataConversation from './utils/dataNewConversation'
var monkey = new Monkey ();

class App extends React.Component {
	constructor(props){
		super(props);
		this.state = {
			conversation: {}
		}
		this.view = {
			type: 'classic',
			data: {
            	width: '380px',
				height: '500px'
        	}
		}
		this.handleMessageToSet = this.handleMessageToSet.bind(this);
		this.handleUserSessionToSet = this.handleUserSessionToSet.bind(this);
		this.conversationToSet = this.conversationToSet.bind(this);
	}
	
	componentWillReceiveProps(nextProps) {
		if(Object.keys(nextProps.store.conversations).length){
			this.setState({conversation: nextProps.store.conversations[Object.keys(nextProps.store.conversations)[0]]});
		}
	}
	
	render() {
		return (
			<MonkeyUI view={this.view} userSession={this.props.store.users.userSession} conversation={this.state.conversation} conversations={this.props.store.conversations} userSessionToSet={this.handleUserSessionToSet} messageToSet={this.handleMessageToSet} />
		)
	}
	
	handleMessageToSet(message) {
		// replace message.id with oldMessageId, when use monkey
		message.id = Object.keys(this.props.store.conversations[message.recipientId].messages).length + 1;
		store.dispatch(actions.addMessage(message));
	}
	
	handleUserSessionToSet(user) {
		store.dispatch(actions.addUserSession(user));
		monkey.init(vars.MONKEY_APP_ID, vars.MONKEY_APP_KEY, user, true, vars.MONKEY_DEBUG_MODE);
	}
	
	conversationToSet() {
		let newConversation = dataConversation;
		store.dispatch(actions.addConversation(newConversation));
	}
}

function render() {
	ReactDOM.render(<App store={store.getState()}/>, document.getElementsByTagName('body')[0]);
}

render();
store.subscribe(render);

// MonkeyKit

monkey.addListener('onConnect', function(event){
	let user = event;
	user.id = event.monkeyId;
	store.dispatch(actions.addUserSession(user));
	addConversation(user);
});

function addConversation(user) {
	let conversationId = 'G:388';
	if(isConversationGroup(conversationId)) { // group conversation
		monkey.getInfoById(conversationId, function(error, data){
	        if(data != undefined){
		        var _members = data.members;
		        var _info = {name: 'Support: '+user.name}
		        monkey.createGroup(_members, _info, null, null, function(error, data){ // create new group
			        if(data != undefined){
			        	let newConversation = {
				        	id: data.group_id,
				        	name: data.group_info.name,
				        	urlAvatar: 'http://cdn.criptext.com/MonkeyUI/images/userdefault.png',
				        	unreadMessageCount: 0,
				        	members: data.members_info,
				        	messages: {}
			        	};
			        	store.dispatch(actions.addConversation(newConversation));
			        }else{
				        console.log(error);
			        }
		        });
	        }else{
		        console.log(error);
	        }
        });
	}
}