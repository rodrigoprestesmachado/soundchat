/**
 * @license
 * Copyright 2016, Rodrigo Prestes Machado
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
	localizaton: '',
	language: "",
	isLogin: '',
	users: '',
	numberUsers: 0,
	messages: '',
	soundConnect: 'connect',
	soundMessage: 'sendMessage',
	soundTyping: 'typing',
	srcAudioConnect:'',
	srcAudioSend:'',
	srcAudioTyping:'',
	gainEffect: '',
	listeners: {
		'buttonEnter.tap': 'loginAction',
		'buttonSend.tap': 'sendMessageAction'
	},

	/**
	 * Method to init the component
	 */
	ready: function() {
		this.numberUsers = 0;
		this.users = [];
		this.messages = [];
		this.isLogin = false;
		this.isTyping = false;
		
		this.$.soundConfig.checked = true;
		this.$.connectConfig.checked = true;
		this.$.messageConfig.checked = true;
		this.$.typingConfig.checked = true;
		
		this.labelSystemStatus = "on";
		this.labelConnectStatus = "on";
		this.labelMessageStatus = "on";
		this.labelTypingStatus = "on";
		
		this.language = this.getBrowserLanguage();
		this.localizaton = this.loadLocalization();
	},
 
	/**
	 * Method used in login action, the user must provide a name
	 */
	loginAction: function() {
		//Load the sound. It's important for mobile application in IOS, because
		//the preload is disabled
		this.$.audioConnect.load();
		this.$.audioSend.load();
		this.$.audioTyping.load();
		
		if (this.$.inputName.value != ""){
			this.fire("connect", {name: this.$.inputName.value});
		}
    },
    
    /**
     * Sends the message typing to the server. With this message the server can 
     * broadcast a message to to inform that someone is typing
     */
    typingEvent: function(event){
    	if (event.keyCode === 13){
    		this.fire("sendMessage", {message: this.$.inputMessage.value});
    		this.$.inputMessage.value = "";
    	}else{
    		this.fire("typing", {name: this.$.inputName.value});
    	}
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
     * Method used to play a sound depending on the sound control options set by
     * users.
     *  
     * @param String audio : The audio that the system wants to play. It's related
     *    with the audios loaded on the system
     * @param String intention : Verify the action (intention) the system wants
     *    to play 
     */
    playAudio: function(audio, intention){
    	if ((this.$.soundConfig.checked === true) && (this.isLogin == true) ){
    		if (this.canPlay(intention)){
    			if (audio === "connect")
					this.$.audioConnect.play();
    			else if (audio === "sendMessage")
    				this.$.audioSend.play();
        		else if (audio === "typing")
        			this.$.audioTyping.play();
    		}
    	}
    },
    
    /**
     * Executes the messages messages from the server
     */
    ack: function(strJson) {
    	// Parses the JSON message from WS service
    	var data = JSON.parse(strJson);
    	
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
    		this.playAudio(this.soundMessage, "sendMessage");
    		this.push('messages', {"user": data.user, "message": data.message, "time": data.time});
    		this.isTyping = false;
    	}
    	else if (data.type === 'ackTyping'){
    		if (data.user != this.$.inputName.value ) {
    			this.isTyping = true;
    			this.playAudio(this.soundTyping, "typing");
    			this.updateScroll();
    		}
    	}
    },
    
    /**
     * This method updates the position of a new message on the page (scroll)
     */
    updateScroll: function(){
		if (this.$.content.scrollHeight > this.$.content.offsetHeight){
			this.$.content.scrollTop = this.$.content.scrollHeight - this.$.content.offsetHeight;
		}
    },
    
    /**
     * Verify if the sound can be played
     */
    canPlay: function(intention){
    	if ((intention === "connect") && (this.$.connectConfig.checked === true))
    		return true;
    	else if ((intention === "sendMessage") && (this.$.messageConfig.checked === true))
    		return true;
    	else if ((intention === "typing") && (this.$.typingConfig.checked === true))
    		return true;
    	else
    		return false;
    },
    
    /**
     * Enable and disable the system sounds
     */
    changeSystemSoundConfiguration: function(){
    	if (this.$.soundConfig.checked === false){
    		this.$.connectConfig.checked = false;
    		this.$.messageConfig.checked = false;
    		this.$.typingConfig.checked = false;
    		
    		this.labelSystemStatus = "off";
    		this.labelConnectStatus = "off";
    		this.labelMessageStatus = "off";
    		this.labelTypingStatus = "off";
    	}
    	else{
    		this.$.connectConfig.checked = true;
    		this.$.messageConfig.checked = true;
    		this.$.typingConfig.checked = true;
    		
    		this.labelSystemStatus = "on";
    		this.labelConnectStatus = "on";
    		this.labelMessageStatus = "on";
    		this.labelTypingStatus = "on";
    	}
    },
    
    /**
     * This method selects a type of sound for a type of action 
     */
    selectConnectSound: function(){
    	this.soundConnect = this.$.opstionsConnectSound.selectedItem.attributes[0].value;
    	this.playAudio(this.soundConnect, "connect" );
    },
    
    /**
     * This method selects a type of sound for a type of action 
     */
    selectMesssgeSound: function(){
    	this.soundMessage = this.$.opstionsMessageSound.selectedItem.attributes[0].value;
    	this.playAudio(this.soundMessage, "sendMessage");
    },
    
    /**
     * This method selects a type of sound for a type of action 
     */
    selectTypingSound: function(){
    	this.soundTyping = this.$.opstionsTypingSound.selectedItem.attributes[0].value;
    	this.playAudio(this.soundTyping, "typing");
    },
    
    /**
     * Change the label (on) or (off) of the connection sound status 
     */
    changeLabelConnectStatus: function(){
    	if (this.$.connectConfig.checked === true)
    		this.labelConnectStatus = "on";
    	else
    		this.labelConnectStatus = "off"
    },
    
    /**
     * Change the label (on) or (off) of the message sound status 
     */
    changeLabelMessageStatus: function(){
    	if (this.$.messageConfig.checked === true)
    		this.labelMessageStatus = "on";
    	else
    		this.labelMessageStatus = "off"
    },
    
    /**
     * Change the label (on) or (off) of the typing sound status 
     */
    changeLabelTypingStatus: function(){
    	if (this.$.typingConfig.checked === true)
    		this.labelTypingStatus = "on";
    	else
    		this.labelTypingStatus = "off"
    },
    
    /**
	 * Verify the browser language
	 * 
	 * @return {String} The browser language
	 **/
	getBrowserLanguage: function(){
		var language = window.navigator.userLanguage || window.navigator.language;
		return language.toLowerCase();
	},
	
    /**
	 * Verify the browser language and returns an object with localized editor 
	 * messages
	 * 
	 * @return {Object} Object with localized editor messages
	 **/
	loadLocalization: function() {
		if (this.language.indexOf("en") > -1) {
			return enUs;
		}
		else if (this.language.indexOf("pt") > -1) {
			return ptBr;
		}
		else if (this.language.indexOf("es") > -1){
			return esEs;
		}
		else{
			return ptBr; 
		} 
	}
 });