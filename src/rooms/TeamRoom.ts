import { Room, Client } from "colyseus";
import e, { json } from "express";
import { GameState,Player,Territory,Treasure, V2 } from "./schema/GameState";
import {RespawnCommand,NPCHit,DefeatPlayerCommand,ConquerCommand,AddNPCCommand, AddModifier, RemoveModifier} from "../commands/commands"
import { Dispatcher } from "@colyseus/command";
export class TeamRoom extends Room {
  dispatcher = new Dispatcher(this);
  teamCount = 0;
  authorityClient:Client = null;//let one client (the first who joined) report hit and collision;
  playerCount = 0;
  playerClients = new Map();
  autoDispose = false; 
  MessageType = {
    Position: 0,
    MouseWorldPos:1,
    Click:2,
    Attack:3,
    Start:4,
    Inventory:5,
    NPCPos:6,
    NPCAttack:7,
    NPCDamage:8,
    NPCDir:9
  }

  onCreate (options: any) {
    var state = new GameState();
    state.playerCount = 0;
    this.teamCount = 0;
    
    state.territories.set("flag_1",new Territory("flag_1"));
    
    this.setState(state);

    this.onMessage(this.MessageType.Position, (client, message) => {
      var player = this.state.players.get(client.sessionId);
      player.pos.x = message.x;
      player.pos.y = message.y;
      //this.state.players.set(client.sessionId,player);
    });

    this.onMessage(this.MessageType.MouseWorldPos, (client, message) => {
      var player = this.state.players.get(client.sessionId);
      player.mousePos.x = message.x;
      player.mousePos.y = message.y;
     // this.state.players.set(client.sessionId,player);
    });

    this.onMessage(this.MessageType.Click,(client,message)=>{
      console.log("click");
      this.broadcast(this.MessageType.Click,{clientID:client.sessionId})
    })
    
    this.onMessage(this.MessageType.Attack,(client,message)=>{
      console.log("player health updated");
      console.log("receiver is", message.receiver, "received damage", message.damage)
      var receiver = this.state.players.get(message.receiver);
      var dealer = this.state.players.get(message.dealer)||this.state.NPCs.get(message.dealer);
      if(!dealer||!receiver){
        return console.log("player hit reported but cant find target or dealer")
      }
        if(receiver.team == dealer.team){
          console.log("team damage"+receiver.team)
          return;
        }
      
      
      receiver.health -= message.damage;
      if(receiver.health<=0){
        this.defeatPlayer(receiver,dealer);
      }
    })

    this.onMessage(this.MessageType.Start,(client,m)=>{
      console.log("start ");
    //  this.lock();
    
     
    })
    this.onMessage(this.MessageType.Inventory,(client,message)=>{
     
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
    this.onMessage("regular_ability",(client,abilityID)=>{
      this.broadcast("ability",{userID:client.sessionId,abilityID})
    })
    this.onMessage("add_modifier",(client,message)=>{
      console.log(message);
      this.dispatcher.dispatch(new AddModifier(),{playerId:message.playerId,modifierId:message.ModifierId});

    })
    this.onMessage("remove_modifier",(client,message)=>{
      //console.log("click");
      this.dispatcher.dispatch(new RemoveModifier(),{playerId:message.playerId,modifierId:message.ModifierId});
      
    })
    this.onMessage("team",(client,team)=>{
      console.log("change team name",team);
      this.state.players.get(client.sessionId).team = team;
    })
    this.onMessage("conquer",(client,message)=>{
      //console.log("click");
      this.dispatcher.dispatch(new ConquerCommand(),{playerID:client.sessionId,flagID:message});
    })
    this.onMessage("chat-message",(client,message)=>{
      var senderName = this.state.players.get(client.sessionId).name;
      this.broadcast("chat-message",{chatsender:senderName,content:message});
    });
    this.setSimulationInterval((deltaTime) => this.update(deltaTime));
    this.registerNPC();
  
  
  }
  registerNPC(){
    this.onMessage("new_npc", (clientID,NPCType)=>{
      this.dispatcher.dispatch(new AddNPCCommand(),{ownerID:"null",typeID:NPCType} );
    })
    
    this.onMessage(this.MessageType.NPCPos, (client, NpcPosAndID)=>{

      var pos:V2 = new V2();
      pos.x = NpcPosAndID.x;
      pos.y= NpcPosAndID.y;
      var enemy = this.state.NPCs.get(NpcPosAndID.id);
      if(!enemy){
        return console.log("enemy already destroyed but there are still movement");
      }
      enemy.pos = pos; 
    })
    this.onMessage(this.MessageType.NPCAttack,(client,npcID)=>{//when npc click attack 
      console.log("attack",npcID);
      this.broadcast("npc_attack",npcID);
    })
    this.onMessage(this.MessageType.NPCDamage,(client,{dealerID, hitValue, receiverID})=>{
      //console.log("damage");
      this.dispatcher.dispatch(new NPCHit(),{dealer:dealerID,receiver:receiverID,hitValue:hitValue});
    })
    this.onMessage(this.MessageType.NPCDir,(client,{npcID, x, y})=>{
      //console.log("damage");
      var pos:V2 = new V2();
      pos.x = x;
      pos.y= y;
      var enemy = this.state.NPCs.get(npcID);
      if(!enemy){
        return console.log("enemy already destroyed but there are still movement");
      }
      enemy.mousePos = pos; 
    })
  }
  update (deltaTime:Number) {

  }
  defeatPlayer(receiver:Player,Dealer:Player){
    this.dispatcher.dispatch(new DefeatPlayerCommand(),receiver.clientID);//single responsibility
    //
    Dealer.score = Dealer.score +10;
    console.log("killfeed");
    
    this.broadcast("notification_killfeed", {receiver:receiver.name,dealer:Dealer.name});
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
   // this.broadcast("start");
    this.state.alivePlyaer++;
    this.state.players.set(player.clientID ,player);
  }

  onLeave (client: Client, consented: boolean) {
  }

  onDispose() {
  }

}
