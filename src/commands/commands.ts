import { Command } from "@colyseus/command";
import e from "express";
import {GameState, NPC} from "../rooms/schema/GameState";
import { Schema, MapSchema, ArraySchema, Context } from "@colyseus/schema";
var id = 0;
export class onMoveCommand
 extends Command<GameState, {
   
}> 
{

  execute() {
  
  }

}
export class AddNPCCommand extends Command<GameState, { ownerID: string, typeID: string } > {

  execute({ownerID,typeID}=this["payload"]) {
  id++;
  console.log("new npc added");
  var npc = new NPC(id.toString());
  npc.ownerID = ownerID;
  if(ownerID == "null"){
    npc.team = "enemy";
  }
  else{
    npc.team = this.state.players.get(ownerID).team;
  }

  npc.type == typeID;//the server is type agonistic, it only matters to the client for instantiation
  this.state.NPCs.set(id.toString(),npc);
  
  //this.room.broadcast("new_npc",this.state.NPCs.get(id.toString()));//tell all clients to remove existing script for a player and instantiate a new instance
}

}
export class RespawnCommand extends Command<GameState, {
 
}> {

  execute(sessionId:string) {
  console.log("respawn player",sessionId);
 // console.log(this.state.players.get(sessionId).stat.modifiers);
  this.state.players.get(sessionId).health = 100;
  this.state.players.get(sessionId).pos.x = Math.random()*10;
  this.state.players.get(sessionId).pos.y = Math.random()*10;
 // this.state.players.get(sessionId).stat.modifiers = new ArraySchema<string>();
  this.room.broadcast("respawn",this.state.players.get(sessionId));//tell all clients to remove existing script for a player and instantiate a new instance
}

}
export class DefeatPlayerCommand extends Command<GameState, {
 
}> {

  execute(sessionId:string) {
  console.log("defeat player",sessionId);
  this.room.broadcast("defeat",sessionId);//tell all clients to remove existing script for a player and instantiate a new instance
}

}
export class RemoveModifier extends Command<GameState, {
    playerId:string, modifierId:string
}> {

  execute({playerId,modifierId}=this["payload"]) {
  //this.state.players.get(playerId).stat.modifiers.push(modifierId);
}

}
export class AddModifier extends Command<GameState, {
    playerId:string,modifierId:string
}> {

  execute({playerId,modifierId}=this["payload"]) {
  console.log("add modifier",modifierId,"to",playerId);
  //this.state.players.get(playerId).stat.modifiers.push(modifierId);
}

}
export class NPCHit extends Command<GameState, {
  dealer: string,  hitValue:number, receiver:string
}> {

  execute({dealer, receiver, hitValue}=this["payload"]) {
  console.log("hit NPC",receiver,hitValue);
  var receiverNPC = this.state.NPCs.get(receiver);
  var dealerNPC = this.state.NPCs.get(dealer)||this.state.players.get(dealer);
  if(!receiverNPC||!dealerNPC){
    console.log("npc", receiver,"already destroyed but there is still hit report");
    return;
  }
  if(receiverNPC.team == dealerNPC.team){
    console.log("team damage"+receiverNPC.team)
    return;
  }
  receiverNPC.health -= hitValue;
  if(receiverNPC.health<=0){
     this.state.NPCs.delete(receiver);
  }
  //tell all clients to remove existing script for a player and instantiate a new instance
}

}
export class ConquerCommand extends Command<GameState, { playerID: string, flagID: string } >{

  execute({flagID,playerID}=this["payload"]) {
  console.log("conquer flag", flagID);
  if(this.state.players.get(playerID).health<=0){
    return;
  };
  this.state.territories.get(flagID).conquer(this.state.players.get(playerID).team,(newOwner:string,id:string)=>{
    
  });
  
  
  
  //tell all clients to remove existing script for a player and instantiate a new instance
}

}