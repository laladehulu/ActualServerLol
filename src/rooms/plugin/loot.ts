import { Room, Client, generateId } from "colyseus";
import { Schema, MapSchema, ArraySchema, Context } from "@colyseus/schema";
import e from "express";
enum NPCType {
    S_DeathKnight="S_DeathKnight", S_Warrior="S_Warrior"
}
const type = Context.create();
function AddLootSystem(Room:Room){//only take message from authority client
    //a drop loot method that spawn a loot at any position.
    //can be called by both the authority client as random loot spawn or by npc manager when an npc dies
    //authority client still have to call the methods to get the loot
    //authority client reference to loot can be a bunch of ID, and when a new loot is added, it automatically check if that loot reference belongs here
    //there should be loot preset that can be spawned
    //server doesnt care about the preset. Like npc, client is responsible of fetching each preset
    //each client(non authority) send fetch command to the server
    //so, loot manmager is only responsible for  
    //Room.onMessage("")
}