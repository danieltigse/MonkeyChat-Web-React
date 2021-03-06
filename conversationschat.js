import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import MonkeyUI from './components/MonkeyUI.js'
import Monkey from 'monkey-sdk'
import { isConversationGroup } from './utils/monkey-utils.js'
import * as vars from './utils/monkey-const.js'

import { createStore } from 'redux'
import reducer from './reducers'
import initData from './utils/data'
const store = createStore(reducer, { conversations: {}, users: {} });

import * as actions from './actions'
import dataConversation from './utils/dataNewConversation'

const monkey = new Monkey ();

class App extends React.Component {
	constructor(props){
		super(props);
		this.state = {
			conversation: {}
		}
		this.view = {
			type: 'fullscreen'
		}
		this.handleMessageToSet = this.handleMessageToSet.bind(this);
		this.handleUserSessionToSet = this.handleUserSessionToSet.bind(this);
		this.handleConversationOpened = this.handleConversationOpened.bind(this);
	}
	
	componentWillMount() {
	}
	
	componentWillReceiveProps(nextProps) {
	}
	
	render() {
		return (
			<MonkeyUI view={this.view} userSession={this.props.store.users.userSession} conversations={this.props.store.conversations} userSessionToSet={this.handleUserSessionToSet} messageToSet={this.handleMessageToSet} conversationOpened={this.handleConversationOpened} loadMessages={this.handleLoadMessages}/>
		)
	}
	
	handleUserSessionToSet(user) {
		user.monkeyId = 'if9ynf7looscygpvakhxs9k9';
		user.urlAvatar = 'https://secure.criptext.com/avatars/avatar_2275.png';
		monkey.init(vars.MONKEY_APP_ID, vars.MONKEY_APP_KEY, user, false, vars.MONKEY_DEBUG_MODE, false);
	}
	
	handleMessageToSet(message) {
		prepareMessage(message);
	}
	
	handleConversationOpened(conversation) {
		console.log('hi conversation');
		monkey.sendOpenToUser(conversation.id);
	}
	
	handleLoadMessages(conversation) {
		console.log('load more messages from conversation');
		monkey.getConversationMessages(conversation.id, 10, conversation.messages[0], function(){
			console.log('hello its me from the get conversations ' + conversation.messages);
		});
	}
/*
	conversationToSet() {
		let newConversation = dataConversation;
		store.dispatch(actions.addConversation(newConversation));
	}
*/
}

function render() {
	ReactDOM.render(<App store={store.getState()}/>, document.getElementsByTagName('body')[0]);
}

render();
store.subscribe(render);

// MonkeyKit

// --------------- ON CONNECT ----------------- //
monkey.on('onConnect', function(event){
	let user = event;
	if(!Object.keys(store.getState().users).length){
		console.log('App - onConnect');
		user.id = event.monkeyId;
		store.dispatch(actions.addUserSession(user));
	}
	if(!Object.keys(store.getState().conversations).length){
		getConversations();
	}
});

// -------------- ON DISCONNECT --------------- //
monkey.on('onDisconnect', function(event){
	console.log('App - onDisconnect');
});

// --------------- ON MESSAGE ----------------- //
monkey.on('onMessage', function(mokMessage){
	console.log('onMessage');
	defineMessage(mokMessage);
});

// ------------- ON NOTIFICATION --------------- //
monkey.on('onNotification', function(mokMessage){
// 	console.log('onNotification');
// 	console.log(mokMessage);
});

// -------------- ON ACKNOWLEDGE --------------- //
monkey.on('onAcknowledge', function(mokMessage){
	console.log('onAcknowledge');
// 	console.log(mokMessage);
	
	let ackType = mokMessage.protocolType;
	let conversationId = mokMessage.senderId;
	switch (ackType){
        case 1:{ // text
            console.log('text message received by the user');
            
            let old_id = mokMessage.oldId;
            let new_id = mokMessage.id;
            let status = mokMessage.props.status;
            
//             monkeyUI.updateStatusMessageBubble(old_id,new_id,status);
        }
		break;
        case 2:{ // media
            console.log('file message received by the user');

            let old_id = mokMessage.oldId;
            let new_id = mokMessage.id;
            let status = mokMessage.props.status;
//             monkeyUI.updateStatusMessageBubble(old_id,new_id,status);
        }
        break;
        case 203:{ // open conversation
            console.log('open conversation received by the user');
            let conversation = {
	            id: conversationId,
	            lastOpenMe: Number(mokMessage.props.last_open_me)*1000,
	            lastOpenApp: Number(mokMessage.props.last_seen)*1000,
	            online: Number(mokMessage.props.online)
            }
            store.dispatch(actions.updateConversationStatus(conversation));
//             _conversation.setLastOpenMe(_lastOpenMe);
            //monkeyUI.updateStatusMessageBubbleByTime(_conversationId,_lastOpenMe);
//             monkeyUI.updateOnlineStatus(_lastOpenApp,_online);
        }
        break;
        default:
            break;
    }
});

function getConversations() {
	monkey.getAllConversations(function(err, res){
        if(err){
            console.log(err);
        }else if(res){
	        let conversations = {};
	        res.data.conversations.map (conversation => {
		        if(!Object.keys(conversation.info).length)
		        	return;
		        
		        let conversationTmp = {
			    	id: conversation.id,
			    	name: conversation.info.name,
			    	messages: {
			    		[conversation.last_message.id]: {
				    		id: conversation.last_message.id,
					    	datetimeCreation: conversation.last_message.datetimeCreation,
					    	datetimeOrder: conversation.last_message.datetimeOrder,
					    	recipientId: conversation.last_message.rid,
					    	senderId: conversation.last_message.sid,
					    	text: conversation.last_message.text,
					    	preview: conversation.last_message.text,
					    	bubbleType: 1
			    		}
			    	},
			    	lastMessage: conversation.last_message.id
		    	}
		    	
		        if(isConversationGroup(conversation.id)){
			        conversationTmp.members = conversation.members;
		        }else{
			        conversationTmp.lastOpenMe = undefined,
			    	conversationTmp.lastOpenApp = undefined,
			    	conversationTmp.online = undefined
		        }
		        conversations[conversationTmp.id] = conversationTmp;
	        })
	        store.dispatch(actions.addConversations(conversations));
	        monkey.getPendingMessages();
        }
    });
}

function prepareMessage(message) {
	switch (message.bubbleType){
		case 1: { // bubble text
			let mokMessage = monkey.sendEncryptedMessage(message.text, message.recipientId, null);
			message.id = mokMessage.id;
			message.oldId = mokMessage.oldId;
			message.datetimeCreation = mokMessage.datetimeCreation;
			message.datetimeOrder = mokMessage.datetimeOrder;
			console.log('App - message to add');
			store.dispatch(actions.addMessage(message, message.recipientId));
			break;
		}
		case 2: { // bubble image
			let mokMessage = monkey.sendEncryptedFile(message.data, message.recipientId, message.filename, message.mimetype, 3, false, null, null, function(err, mokMessage){
				if (err){
					console.log(err);
				}else{
					console.log('to update');
					console.log(mokMessage);
					let message = {
						id: mokMessage.id,
						oldId: mokMessage.oldId,
						status: 51,
						recipientId: mokMessage.recipientId
					}
// 					store.dispatch(actions.updateMessageStatus(message, message.recipientId));
				}
			});
			message.id = mokMessage.id;
			message.oldId = mokMessage.oldId;
			message.datetimeCreation = mokMessage.datetimeCreation;
			message.datetimeOrder = mokMessage.datetimeOrder;
			console.log('to load');
			console.log(message);
			store.dispatch(actions.addMessage(message, message.recipientId));
			break;
		}
		case 3: { // bubble file
			let mokMessage = monkey.sendEncryptedFile(message.data, message.recipientId, message.filename, message.mimetype, 4, false, null, null, function(err, message){
				if (err){
					console.log(err);
				}else{
					console.log(message);
				}
			});
			message.id = mokMessage.id;
			message.oldId = mokMessage.oldId;
			message.datetimeCreation = mokMessage.datetimeCreation;
			message.datetimeOrder = mokMessage.datetimeOrder;
			store.dispatch(actions.addMessage(message, message.recipientId));
			break;
		}
		case 4: { // bubble audio
			let mokMessage = monkey.sendEncryptedFile(message.data, message.recipientId, message.filename, message.mimetype, 4, false, null, null, function(err, message){
				if (err){
					console.log(err);
				}else{
					console.log(message);
				}
			});
			message.id = mokMessage.id;
			message.oldId = mokMessage.oldId;
			message.datetimeCreation = mokMessage.datetimeCreation;
			message.datetimeOrder = mokMessage.datetimeOrder;
			store.dispatch(actions.addMessage(message, message.recipientId));
			break;
		}
	}
}

function defineMessage(mokMessage) {
	console.log(mokMessage);
	console.log(store.getState().users.userSession);
	let conversationId = store.getState().users.userSession.id == mokMessage.recipientId ? mokMessage.senderId : mokMessage.recipientId;
	let message = {
		id: mokMessage.id,
		oldId: mokMessage.oldId,
    	datetimeCreation: mokMessage.datetimeCreation,
    	datetimeOrder: mokMessage.datetimeOrder,
    	recipientId: mokMessage.recipientId,
    	senderId: mokMessage.senderId
	}
	switch (mokMessage.protocolType){
		case 1:{
			message.bubbleType = 1;
			message.text = mokMessage.text;
			message.preview = mokMessage.text;
			break;
		}
		case 2:{
			message.filename = mokMessage.props.file_type;
			message.mimetype = mokMessage.props.mime_type;
			message.filesize = mokMessage.props.size;
			if(mokMessage.props.file_type == 1){ // audio
				message.bubbleType = 4;
				message.preview = 'Audio';
				
				monkey.downloadFile(mokMessage, function(err, data){
					let src = 'data:audio/mpeg;base64,'+data;
					let message = {
						id: mokMessage.id,
						data: src
					}
					console.log(mokMessage.id);
					console.log(mokMessage.oldId);
					store.dispatch(actions.updateMessageData(message, conversationId));
				});
				
			}else if(mokMessage.props.file_type == 3){ // image
				message.bubbleType = 2;
				message.preview = 'Image';
				monkey.downloadFile(mokMessage, function(err, data){
					console.log(data);
					let src = 'data:'+mokMessage.props.mime_type+';base64,'+data;
					let message = {
						id: mokMessage.id,
						data: src
					}
					console.log(mokMessage.id);
					console.log(mokMessage.oldId);
// 					store.dispatch(actions.updateMessageData(message, conversationId));
				});
			}else if(mokMessage.props.file_type == 4){ // file
				message.bubbleType = 3;
				message.preview = 'File';
			}
			break;
		}
	}
	store.dispatch(actions.addMessage(message, conversationId));
}