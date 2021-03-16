import { Room, Client, generateId } from "colyseus";
import { Schema, MapSchema, ArraySchema, Context } from "@colyseus/schema";
import e from "express";
enum NPCType {
    S_DeathKnight="S_DeathKnight", S_Warrior="S_Warrior"
}
const type = Context.create();
function AddNpcSystem(Room:Room){
    
}