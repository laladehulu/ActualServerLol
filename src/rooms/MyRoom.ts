import { Room, Client } from "colyseus";
import { json } from "express";
import { GameState,Player,Treasure } from "./schema/GameState";
import {RespawnCommand,DefeatPlayerCommand} from "../commands/commands"
import { Dispatcher } from "@colyseus/command";
export class MyRoom extends Room {
  dispatcher = new Dispatcher(this);
  teamCount = 0;
  authorityClient:Client = null;//let one client (the first who joined) report hit and collision;
  playerCount = 0;
  playerClients = new Map(); 
  onCreate (options: any) {
    var state = new GameState();
    state.playerCount = 0;
    this.teamCount = 0;
    const MessageType = {
      Position: 0,
      MouseWorldPos:1,
      Click:2,
      Attack:3,
      Start:4,
      Inventory:5
    }

    this.setState(state);

    this.onMessage(MessageType.Position, (client, message) => {
      var player = this.state.players.get(client.sessionId);
      player.pos.x = message.x;
      player.pos.y = message.y;
      //this.state.players.set(client.sessionId,player);
    });

    this.onMessage(MessageType.MouseWorldPos, (client, message) => {
      var player = this.state.players.get(client.sessionId);
      player.mousePos.x = message.x;
      player.mousePos.y = message.y;
     // this.state.players.set(client.sessionId,player);
    });

    this.onMessage(MessageType.Click,(client,message)=>{
      //console.log("click");
      this.broadcast(MessageType.Click,{clientID:client.sessionId})
    })

    this.onMessage(MessageType.Attack,(client,message)=>{
      console.log("player health updated");
      console.log("receiver is", message.receiver, "received damage", message.damage)
      
      var receiver = this.state.players.get(message.receiver);

      receiver.health -= message.damage;
      if(receiver.health<=0){
        this.defeatPlayer(client.sessionId);
      }
    })

    this.onMessage(MessageType.Start,(client,m)=>{
      console.log("start ");
    //  this.lock();
      setTimeout(() => {
        this.authorityClient.send("authority",{});//let the authority client report physics
        console.log("send authority");
      }, (500));
     
    })
    this.onMessage(MessageType.Inventory,(client,message)=>{
     
      var inventoryObj = JSON.parse(message);
      console.log(inventoryObj);
      var player = this.state.players.get(client.sessionId);
      if(!player){return console.log("update inventory: not a player");}
      player.inventory.equipped = inventoryObj.Equipment;
      player.inventory.unequipped = inventoryObj.Inventory;
      
      console.log("inventory change ");
    })
    this.onMessage("name",(client,name)=>{
      this.state.players.get(client.sessionId).name = name;
    })
    this.onMessage("respawn",(client)=>{
      this.dispatcher.dispatch(new RespawnCommand(),client.sessionId);
    })
    this.onMessage("team",(client,teamName)=>{
      this.state.players.get(client.sessionId).team = teamName;
    })
    
  
    
  }
 
  defeatPlayer(id:string){
    this.dispatcher.dispatch(new DefeatPlayerCommand(),id);
    //

  }
 
  win(){
    console.log("game over")
    this.state.players.forEach((player:Player, key:string) => {
      if(!player.isDefeated()){
        console.log("WINNN");
        this.playerClients.get(player.clientID).send("win",{});
      }
      else{
        this.playerClients.get(player.clientID).send("lose",{});
      }
  });
    this.disconnect();
  }
  onJoin (client: Client, options: any) {
    if(this.state.playerCount ==0){
      this.authorityClient = client;
     


    }
    this.addPlayer(client.sessionId,client)
    console.log("client joined");

  }
  addPlayer(clientID:string,client:Client){
    this.playerClients.set(clientID,client);//for sending message to a specific player
    //this holds reference to the socket while the state holds the state
    var player = new Player();
    player.clientID = clientID;
    player.team = "default";
    player.pos.x = Math.random()*3;
    player.pos.y = Math.random()*3;
    this.state.playerCount++;
    this.broadcast("start");
    this.state.alivePlyaer++;
    this.state.players.set(player.clientID ,player);
  }

  onLeave (client: Client, consented: boolean) {
  }

  onDispose() {
  }

}
