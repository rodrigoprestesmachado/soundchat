/**
 * @license
 * Copyright 2015, Rodrigo Prestes Machado
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 * 		http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Polymer({
	is: 'sound-chat',
	numberUsers: 0,
	users: '',
	messages: '',
	isLogin: '',
	soundConnect: 'connect',
	soundMessage: 'sendMessage',
	soundTyping: 'typing',
	soundColor:'',
	srcAudioConnect:'',
	srcAudioSend:'',
	srcAudioTyping:'',
	gainEffect: '',
	listeners: {
		'buttonEnter.tap': 'loginAction',
		'buttonSend.tap': 'sendMessageAction'
	},

	/**
	 * Method to init the things
	 */
	ready: function() {
		this.numberUsers = 0;
		this.users = [];
		this.messages = [];
		this.isLogin = false;
		this.isTyping = false;
		this.$.soundConfig.checked = false;
		
		
		
		
	},
 
	/**
	 * Method used in login action, the user must provide a name
	 */
	loginAction: function() {
		if (this.$.inputName.value != ""){
			
			var soundContext = new AudioContext();
			this.gainEffect = soundContext.createGain();
			
			this.srcAudioConnect = soundContext.createMediaElementSource(this.$.audioConnect);
			this.srcAudioSend = soundContext.createMediaElementSource(this.$.audioSend);
			this.srcAudioTyping = soundContext.createMediaElementSource(this.$.audioTyping);
			
			this.srcAudioConnect.connect(this.gainEffect);
			this.srcAudioSend.connect(this.gainEffect);
			this.srcAudioTyping.connect(this.gainEffect);
			
			this.gainEffect.connect(soundContext.destination);
			
			this.fire("connect", {name: this.$.inputName.value});
		}
    },
    
    typingEvent: function(){
    	this.fire("typing", {name: this.$.inputName.value});
    },
    
    /**
	 * Method used to send a message to other users
	 */
    sendMessageAction: function() {
    	if (this.$.inputMessage.value != ""){ 
	    	this.fire("sendMessage", {message: this.$.inputMessage.value});
	    	this.$.inputMessage.value = "";
    	}
    },
    
    /**
     * Executes acknowledgement messages
     */
    ack: function(strJson) {
    	// Parses the JSON message from WS service
    	var data = JSON.parse(strJson);
    	
    	this.soundColor = data.soundColor;
    	
    	if (data.type === 'ackConnect'){
    		
    		// Polymer.Base splice method
    		this.splice('users', 0);
    		for (x in data.users) {
    		    var user = data.users[x];
    		    // Polymer.Base push method
    		    this.push('users', {"name": user.name});
    		}
    		
    		// Add stored messages
    		if ((data.messages != "") && (this.messages.length == 0)){
				for (x in data.messages){
					var message = data.messages[x];
					this.push('messages', {"user": message.user, "message": message.textMessage, "time": message.time});
				}
	    	}
    		
    		// Refresh the user`s list
    		this.isLogin = true;
    		// Close the login window
    		this.$.windowLogin.opened = false;
    		// Plays the earcon and update the user`s number 
    		this.playAudio(this.soundConnect, "connect");
    		this.$.accountsBadge.label = data.size;
    	}
    	else if (data.type === 'ackSendMessage'){
    		this.isTyping = false;
    		this.playAudio(this.soundMessage, "sendMessage");
    		this.push('messages', {"user": data.user, "message": data.message, "time": data.time});
    	}
    	else if (data.type === 'ackTyping'){
    		if (data.user != this.$.inputName.value ) {
    			this.isTyping = true;
    			this.playAudio(this.soundTyping, "typing");
    		}
    	}
    },
    
    updateScroll: function(){
		if (this.$.content.scrollHeight > this.$.content.offsetHeight){
			this.$.content.scrollTop = this.$.content.scrollHeight - this.$.content.offsetHeight;
		}
    },
    
    playAudio: function(audio, intention){
    	if ((this.$.soundConfig.checked === false) && (this.isLogin == true) ){
    		if (this.canPlay(intention)){
    			this.gainEffect.gain.value = this.soundColor;
				if (audio === "connect")
					this.srcAudioConnect.mediaElement.play();
    			else if (audio === "sendMessage")
    				this.srcAudioSend.mediaElement.play();
        		else if (audio === "typing")
        			this.srcAudioTyping.mediaElement.play();
    		}
    	}
    },
    
    canPlay: function(intention){
    	if ((intention === "connect") && (this.$.connectConfig.checked === false))
    		return true;
    	else if ((intention === "sendMessage") && (this.$.messageConfig.checked === false))
    		return true;
    	else if ((intention === "typing") && (this.$.typingConfig.checked === false))
    		return true;
    	else
    		return false;
    },
    
    selectConnectSound: function(){
    	this.soundConnect = this.$.opstionsConnectSound.selectedItem.attributes[0].value;
    	this.playAudio(this.soundConnect, "connect" );
    },
    
    selectMesssgeSound: function(){
    	this.soundMessage = this.$.opstionsMessageSound.selectedItem.attributes[0].value;
    	this.playAudio(this.soundMessage, "sendMessage");
    },
    
    selectTypingSound: function(){
    	this.soundTyping = this.$.opstionsTypingSound.selectedItem.attributes[0].value;
    	this.playAudio(this.soundTyping, "typing");
    },
    
    changeSystemSoundConfiguration: function(){
    	if (this.$.soundConfig.checked === true){
    		this.$.connectConfig.checked = true;
    		this.$.messageConfig.checked = true;
    		this.$.typingConfig.checked = true;
    	}
    	else{
    		this.$.connectConfig.checked = false;
    		this.$.messageConfig.checked = false;
    		this.$.typingConfig.checked = false;
    	}
    }
 });