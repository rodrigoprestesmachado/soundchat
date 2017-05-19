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
package edu.ifrs.soundChat.ws;

import java.io.IOException;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Root;
import javax.websocket.OnClose;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;

import com.google.gson.Gson;

import edu.ifrs.soundChat.model.InputMessage;
import edu.ifrs.soundChat.model.OutputMessage;
import edu.ifrs.soundChat.model.SoundColors;
import edu.ifrs.soundChat.model.TextMessage;
import edu.ifrs.soundChat.model.Type;
import edu.ifrs.soundChat.model.User;

/**
 * Web Socket server that controls the chat
 * 
 * @author Rodrigo Prestes Machado
 */
@ServerEndpoint("/service")
@Stateless
public class SoundChatWS {

	private static final Logger log = Logger.getLogger(SoundChatWS.class.getName() );
	private static List<User> users = Collections.synchronizedList(new ArrayList<User>());
	private static Gson gson = new Gson();
	private int countSoundColor = 1;
	
	@PersistenceContext(unitName="SoundChat")
	private EntityManager em;    
	
	@OnMessage
	public void onMessage(String jsonMessage, Session session) {
		log.log(Level.INFO, "inputMessage: " + jsonMessage);
		
		InputMessage input = parseInputMessage(jsonMessage, session);
		
		boolean returnMessage = false;
		OutputMessage out = new OutputMessage();
		if (Type.valueOf(input.getType()) == Type.CONNECT) {
			out.setType("ACK_CONNECT");
			out.addData("size", String.valueOf(users.size()));
			out.addData("soundColor", String.valueOf(input.getUser().getSoundColor()));
			out.addData("users", gson.toJson(users));
			out.addData("messages", getMessages());
			returnMessage = true;
		}
		else if (Type.valueOf(input.getType()) == Type.SEND_MESSAGE) {
			out.setType("ACK_SEND_MESSAGE");
			out.addData("message", input.getMessage().getTextMessage());
			out.addData("user", input.getUser().getName());
			out.addData("soundColor", String.valueOf(input.getUser().getSoundColor()));
			SimpleDateFormat sdf = new SimpleDateFormat("HH:mm");
			out.addData("time", sdf.format(input.getDate()));
			returnMessage = true;
		}
		else if (Type.valueOf(input.getType()) == Type.TYPING) {
			out.setType("ACK_TYPING");
			out.addData("user", input.getUser().getName());
			out.addData("soundColor", String.valueOf(input.getUser().getSoundColor()));
			out.addData("user", findUser(session).getName());
			returnMessage = true;
		}
		
		if (returnMessage){
			findUser(session).addOutputMessage(out);
			log.log(Level.INFO, "outputMessage: " + out.toString());
			sendToAll(out.toString());
		}
	}

	/**
	 * Open web socket method
	 * 
	 * @param session
	 */
	@OnOpen
	public void onOpen(Session session) {
		log.log(Level.INFO, "onOpen");
	}

	/**
	 * Close web socket method
	 * 
	 * @param session
	 */
	@OnClose
	public void onClose(Session session) {
		log.log(Level.INFO, "onClose");
		User user = findUser(session);
		users.remove(user);
		
		OutputMessage out = new OutputMessage();
		out.setType("ACK_CONNECT");
		out.addData("size", String.valueOf(users.size()));
		out.addData("users", gson.toJson(users));
		
		log.log(Level.INFO, "outputMessage: " + out.toString());
		sendToAll(out.toString());
	}
	
	/**
	 * Send to all connected users in web socket server
	 * 
	 * @param Strign message : A message in JSON format
	 */
	private void sendToAll(String message){
		try {
			synchronized (users) {
				for (User user : users)
					user.getSession().getBasicRemote().sendText(message);
			}
		} 
		catch (IOException ex) {
			ex.printStackTrace();
		}
	}
	
	/**
	 * Find the user from session
	 * 
	 * @param Session session : Web socket session
	 * @return User object
	 */
	private User findUser(Session session){
		User user = null;
		for (User u : users) {
			String idSesssion = u.getSession().getId();
			if (idSesssion.equals(session.getId()))
				user =  u;
		}
		return user;
	}
	
	/**
	 * Creates the input message object
	 * 
	 * @param String jsonMessage : JSON message from the client
	 * @param Sesstion session : Web Socket session
	 * @return InputMessage object
	 */
	private InputMessage parseInputMessage(String jsonMessage, Session session){
		
		InputMessage input = gson.fromJson(jsonMessage, InputMessage.class);
		Calendar cal = Calendar.getInstance();
		Timestamp time = new Timestamp(cal.getTimeInMillis());
		input.setDate(time);
		
		// Check if the current user is already connected
		User user = findUser(session);
		if (user != null)
			input.setUser(user);
		else{
			user = gson.fromJson(jsonMessage, User.class);
			user.setSession(session);
			user.setSoundColor(genereteSoundColor());
			
			input.setUser(user);
			em.persist(user);
			users.add(user);
		}
		
		// Sets a new sound color for other user
		countSoundColor++;
		
		// Check if the json message contains an text message
		if (jsonMessage.toLowerCase().contains("message")){
			TextMessage message = new TextMessage();
			message = gson.fromJson(jsonMessage, TextMessage.class);
			message.escapeCharacters();
			em.persist(message);
			input.setMessage(message);
		}
		
		// Add input message to the current user
		user.addInputMessage(input);
		
		em.persist(input);
		return input;
	}
	
	/**
	 * Retrieve stored messages from the data base
	 * 
	 * @return A JSON representing a collection of stored messages 
	 */
	private String getMessages(){
		
		StringBuilder json = new StringBuilder();
		json.append("[");
		
		// TODO Implement Where
		CriteriaBuilder builder = em.getCriteriaBuilder();
		
		CriteriaQuery<InputMessage> criteria = builder.createQuery( InputMessage.class );
		Root<InputMessage> root = criteria.from( InputMessage.class );
		criteria.select(root);
		Query query = em.createQuery(criteria);
		List<InputMessage> result = query.getResultList();
		
		boolean flag = false;
		for (InputMessage im : result) {
			if (im.getMessage() != null){
				json.append(im.toString());
				json.append(",");
				flag = true;
			}
		}
		
		StringBuilder str = new StringBuilder();
		if (flag){
			str.append(json.substring(0, json.length()-1));
			str.append("]");
		}
		return str.toString();
	}
	
	/**
	 * Generates sound color
	 * 
	 * @return String : A sound color
	 */
	private String genereteSoundColor(){
		SoundColors effect = null;
		switch (countSoundColor) {
			case 1:
				effect = SoundColors.DELAY;
				break;
			case 2:
				effect = SoundColors.PHASER;
				break;
			case 3:
				effect = SoundColors.CHORUS;
				break;
			default:
				effect = SoundColors.DELAY;
				break;
		}
		return effect.toString();
	}
	
}