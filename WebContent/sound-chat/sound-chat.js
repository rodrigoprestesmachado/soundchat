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
	isLogin: '',
	users: '',
	messages: '',
	numberUsers: 0,
	
	// Sounds Types
	soundConnect: 'connect',
	soundMessage: 'sendMessage',
	soundTyping: 'typing',
	
	// Web Audio API
	audioCtx: '',
	audioSrc: '',
	bufferConnect: '',
	bufferSendMessage: '',
	
	// Sound Colors
	delay: '',
	wahwah: '',
	moog: '',
	
	// Localization
	localization: '',
	language: "",
	
	// GUI Events
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
		
		// TTS Configuration
		this.speechMessage = new SpeechSynthesisUtterance();
		this.speechMessage.rate = 1.5;
		this.speechMessage.volume = 1.1;
		
		// Avoid 5 "someone is typing" messages
		this.countTypingMessages = 40;
		
		this.language = this.getBrowserLanguage();
		this.localization = this.loadLocalization();
		
		// Web Audio API Load
		audioCtx = new (window.AudioContext || window.webkitAudioContext)();
		
		//Load the sound. It's important for mobile application in IOS, because
		var audioDataBaseURL = "http://code.inf.poa.ifrs.edu.br:8080/SoundChat/sound-chat/sounds/"
		bufferConnect = null;
		this.loadAudioBuffer("connect", audioDataBaseURL + "connect.mp3");
		bufferSendMessage = null;
		this.loadAudioBuffer("sendMessage", audioDataBaseURL + "send4.mp3");
		bufferTyping  = null;
		this.loadAudioBuffer("typing", audioDataBaseURL + "typing.mp3");
	},
 
	/**
	 * Method used in login action, the user must provide a name
	 */
	loginAction: function() {
		
		// Sound Effects
		var tuna = new Tuna(audioCtx);
		delay = new tuna.Delay({
		    feedback: 0.6,    //0 to 1+
		    delayTime: 100,   //1 to 10000 milliseconds
		    wetLevel: 0.8,    //0 to 1+
		    dryLevel: 1,      //0 to 1+
		    cutoff: 2000,     //cutoff frequency of the built in lowpass-filter. 20 to 22050
		    bypass: 0
		});
		
		wahwah = new tuna.WahWah({
		    automode: true,                //true/false
		    baseFrequency: 0.5,            //0 to 1
		    excursionOctaves: 2,           //1 to 6
		    sweep: 0.2,                    //0 to 1
		    resonance: 10,                 //1 to 100
		    sensitivity: 0.8,              //-1 to 1
		    bypass: 0
		});
		
		moog = new tuna.MoogFilter({
		    cutoff: 0.4,    //0 to 1
		    resonance: 3,   //0 to 4
		    bufferSize: 4096  //256 to 16384
		});
		
		if (this.$.inputName.value != "")
			this.fire("connect", {name: this.$.inputName.value});
    },
    
    /**
     * Sends the message typing to the server. With this message the server can 
     * broadcast a message to to inform that someone is typing
     */
    typingEvent: function(event){
    	if (event.keyCode === 13){
    		this.fire("sendMessage", {message: this.$.inputMessage.value});
    		this.$.inputMessage.value = "";
    	}
    	else{
    		this.fire("typing", {name: this.$.inputName.value});
    	}
    },
    
    /**
     * Enable login with the user press enter/return button in login name field 
     */
    enterEvent: function(event){
    	if (event.keyCode === 13){
    		this.loginAction();
    	}
    },
    
    /**
	 * Method used to send a message to other users
	 */
    sendMessageAction: function() {
    	if (this.$.inputMessage.value != ""){
    		var msg = this.escapeCharacters(this.$.inputMessage.value);
    		this.fire("sendMessage", {message: msg });
	    	this.$.inputMessage.value = "";
    	}
    },
    
    /**
     * Escape special characters to keep the json message in the right format  
     */
    escapeCharacters: function(message){
    	message = message.replace(/"/g,"\\\"");
		message = message.replace(/'/g,"\\\"");
		return message;
    },
    
    /**
     * Executes the messages messages from the server
     */
    receiveMessage: function(strJson) {
    	try{
    		// Parses the JSON message from WS service
        	var data = JSON.parse(strJson);
        	
        	if (data.type === 'ACK_CONNECT'){
        		// Polymer.Base splice method
        		this.splice('users', 0);
        		
        		var strPeople = "";
        		var numberPeople = 0;
        		for (x in data.users) {
        		    var user = data.users[x];
        		    // Polymer.Base push method
        		    this.push('users', {"name": user.name});
        		    strPeople += "   " + user.name;
        		    numberPeople = numberPeople + 1;
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
        		this.playSound("connect","");
        		
        		// TTS
        		this.speechMessage.text = numberPeople + " " + this.localization.labelTTSRoom;
        		this.playTTS(this.speechMessage, "connect");
        		this.speechMessage.text = strPeople;
        		this.playTTS(this.speechMessage, "connect");
        		
        		this.$.accountsBadge.label = data.size;
        	}
        	else if (data.type === 'ACK_SEND_MESSAGE'){
        		this.playSound("sendMessage", data.soundColor);
        		this.push('messages', {"user": data.user, "message": data.message, "time": data.time});
        		this.isTyping = false;
        	}
        	else if (data.type === 'ACK_TYPING'){
        		if (data.user != this.$.inputName.value ) {
        			this.isTyping = true;
        			this.updateScroll();
        			
        			if (this.countTypingMessages == 15){
        				this.playSound("typing", data.soundColor);
        				this.playTTS(this.speechMessage, "typing");
        			}
        			else if (this.countTypingMessages == 30){
        				this.playSound("typing", data.soundColor);
        			}
        			
        			if (this.countTypingMessages == 40){
        				this.speechMessage.text = data.user;
        				this.playSound("typing", data.soundColor);
        				this.countTypingMessages--;
        			}
        			else{
        				this.countTypingMessages--;
        				if (this.countTypingMessages == -1){
        					this.countTypingMessages = 40;
        				}
        			}
        		}
        	}
    	}
    	catch(err) {
    		this.speechMessage.text = this.localization.labelLoadError;
    		speechSynthesis.speak(this.speechMessage);
    		this.$.ackToast.open();
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
    playSound: function(intention, color){
    	if ((this.$.soundConfig.checked === true) && (this.isLogin == true) ){
    		if (this.canPlay(intention)){
    			if (intention === "connect") {
    				this.playColorfulSound(this.soundConnect, color);
    			}
				else if (intention === "sendMessage") {
					this.playColorfulSound(this.soundMessage, color);
				}
    			else if (intention === "typing") {
    				this.playColorfulSound(this.soundTyping, color);
    			}
        	}
    	}
    },
    
    playColorfulSound: function(soundType, soundColor) {
		
    	// Selects the right buffer
    	var bufferSource = audioCtx.createBufferSource();
		if (soundType === "connect")
			bufferSource.buffer = bufferConnect;
		else if (soundType === "sendMessage")
			bufferSource.buffer = bufferSendMessage;
		else if(soundType === "typing")
			bufferSource.buffer = bufferTyping;
		
		// Sound Graph
		if (soundColor === "NOCOLOR"){
			bufferSource.connect(audioCtx.destination);
		}
		else if (soundColor === "DELAY"){
			bufferSource.connect(delay);
			delay.connect(audioCtx.destination);
		}
		else if (soundColor === "WAHWAH"){
			bufferSource.connect(wahwah);
			wahwah.connect(audioCtx.destination);
		}
		else if (soundColor === "MOOG"){
			var gain = audioCtx.createGain();
			gain.gain.value = 6;
			bufferSource.connect(gain);
			gain.connect(moog);
			moog.connect(audioCtx.destination);
		}
		else
			bufferSource.connect(audioCtx.destination);
		
		// Plays the sound
		bufferSource.start();
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
	
	loadAudioBuffer: function(bufferType, url){
		var request = new XMLHttpRequest(); 
		request.open("GET", url, true); 
		request.responseType = 'arraybuffer';
		request.onload = function() {
			var audioData = request.response;
			audioCtx.decodeAudioData(audioData, function(buffer) {
				if (bufferType === "connect")
					bufferConnect = buffer;
				else if (bufferType === "sendMessage")
					bufferSendMessage = buffer;
				else if(bufferType === "typing")
					bufferTyping = buffer;
			},
			function(e){ console.log("Error with decoding audio data" + e.err); });
		}
		request.send();
	},
	
	/**
     * Method used to execute text to speech  
     */
    playTTS: function(messageObject, intention){
    	if ((this.$.soundConfig.checked === true) && (this.isLogin == true) ){
    		if (this.canPlay(intention)){
    			speechSynthesis.speak(messageObject);
    		}
    	}
    },
    
    /**
     * This method selects a type of sound for a type of action 
     */
    selectConnectSound: function(){
    	this.soundConnect = this.$.opstionsConnectSound.selectedItem.attributes[0].value;
    	this.playSound("connect", "");
    },
    
    /**
     * This method selects a type of sound for a type of action 
     */
    selectMesssgeSound: function(){
    	this.soundMessage = this.$.opstionsMessageSound.selectedItem.attributes[0].value;
    	this.playSound("sendMessage", "");
    },
    
    /**
     * This method selects a type of sound for a type of action 
     */
    selectTypingSound: function(){
    	this.soundTyping = this.$.opstionsTypingSound.selectedItem.attributes[0].value;
    	this.playSound("typing", "");
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
     * This method updates the position of a new message on the page (scroll)
     */
    updateScroll: function(){
		if (this.$.content.scrollHeight > this.$.content.offsetHeight){
			this.$.content.scrollTop = this.$.content.scrollHeight - this.$.content.offsetHeight;
		}
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