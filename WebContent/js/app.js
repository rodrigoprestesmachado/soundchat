/**
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
var app = angular.module('SoundChatApp', []);

/**
 * Web Socket Wrapper for document
 */
app.service('wsDocument', function() {
    var ws;
	this.open = function(url) {
		if (window.MozWebSocket)
			ws = new MozWebSocket(url);
		else
			ws = new WebSocket(url);
    };
    
    this.registerOnMessage = function(onMessageCallBack){
    	ws.onmessage = onMessageCallBack;
    };
    
    this.send = function(text) {
		ws.send(text);
    };
    
});

/**
 * This directive is used to listen the events from sound-chat component
 */
app.directive('soundchatListener', ['$document','wsDocument', function($document, wsDocument) {
  return {
	  link: function(scope, element, attr) {
		  
		  var soundChat = document.querySelector("sound-chat");
		 
		  // Calls Web Socket Wrapper
		  wsDocument.open("ws://localhost:8080/SoundChat/service");
		  
		  // Register onmessage function
		  wsDocument.registerOnMessage(function(event) {
			  soundChat.receiveMessage(event.data);
		  });
		  // Connecting an user in the server
		  soundChat.addEventListener("connect", function(e) {
			  wsDocument.send("{'type':'CONNECT','name':'"+e.detail.name+"'}");
		  });
		  // Sending a message to others
		  soundChat.addEventListener("sendMessage", function(e) {
			  wsDocument.send("{'type':'SEND_MESSAGE','textMessage':'"+e.detail.message+"'}");
		  });
		  soundChat.addEventListener("typing", function(e) {
			  wsDocument.send("{'type':'TYPING','name':'"+e.detail.name+"'}");
		  });
		  soundChat.addEventListener("setSoundColor", function(e) {
			  wsDocument.send("{'type':'SET_SOUND_COLOR','textMessage':'"+e.detail.message+"'}");
		  });
		  soundChat.addEventListener("browsing", function(e) {
			  wsDocument.send("{'type':'BROWSING','name':'"+e.detail.name+"'}");
		  });
	  }
  };
}]);