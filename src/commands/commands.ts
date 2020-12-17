import { Command } from "@colyseus/command";
import {GameState} from "../rooms/schema/GameState";
export class onMoveCommand
 extends Command<GameState, {
   
}> 
{

  execute() {
  
  }

}
export class RespawnCommand extends Command<GameState, {
 
}> {

  execute(sessionId:string) {
  console.log("respawn player",sessionId);
  this.state.players.get(sessionId).health = 100;
  this.state.players.get(sessionId).pos.x = Math.random()*10;
  this.state.players.get(sessionId).pos.y = Math.random()*10;
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
export class ConquerCommand extends Command<GameState, { playerID: string, flagID: string } >{

  execute({flagID,playerID}=this["payload"]) {
  console.log("conquer flag", flagID);
  if(this.state.players.get(playerID).health<=0){
    return;
  };
  this.state.territories.get(flagID).conquer(this.state.players.get(playerID).team);
  //tell all clients to remove existing script for a player and instantiate a new instance
}

}