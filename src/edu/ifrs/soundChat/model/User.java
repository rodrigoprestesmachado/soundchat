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
package edu.ifrs.soundChat.model;

import java.util.ArrayList;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.websocket.Session;

@Entity
public class User {
	
	@Id
	@GeneratedValue
	private long id;
	private String name;
	private String soundColor;
	private transient ArrayList<InputMessage> inputs;
	private transient ArrayList<OutputMessage> outputs;
	private transient Session session;
	
	public User(){
		this.inputs = new ArrayList<>();
		this.outputs = new ArrayList<>();
	}

	public long getId() {
		return id;
	}

	public void setId(long id) {
		this.id = id;
	}
	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}
	
	public String getSoundColor() {
		return soundColor;
	}

	public void setSoundColor(String soundColor) {
		this.soundColor = soundColor;
	}
	
	public Session getSession() {
		return session;
	}

	public void setSession(Session session) {
		this.session = session;
	}
	
	public void addInputMessage(InputMessage input){
		this.inputs.add(input);
	}
	
	public void addOutputMessage(OutputMessage output){
		this.outputs.add(output);
	}

}