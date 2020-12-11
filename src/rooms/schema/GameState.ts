import { Room, Client, generateId } from "colyseus";
import { Schema, MapSchema, ArraySchema, Context } from "@colyseus/schema";
const type = Context.create();
export class V2 extends Schema{
    @type("number") x: number = 0;
    @type("number") y: number = 0;
}
export class Inventory extends Schema{
    constructor(){
        super();
    }
    @type("string") equipped:string;
    @type("string") unequipped:string;
}
export class Player extends Schema{
    @type(V2) pos:V2 = new V2();
    @type(V2) mousePos:V2 = new V2();
    @type("number") health:number = 100;
    @type("number") team:number = 0;
    @type("string") clientID:string;
    @type("string") name:string;
    @type(Inventory) inventory:Inventory = new Inventory();
    isDefeated(){
        if(this.health<=0){
            return true;
        }
        return false;
    }
}

export class Treasure extends Schema{
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("boolean") locked: boolean = true;
    
}
export class GameState extends Schema{
    @type("string") phase:string = "waiting";
    @type("number") playerCount:number = 0;
    @type("number") alivePlyaer:number = 0;
    @type("boolean") waiting:boolean = true;
    @type({ array: Treasure }) treasures = new ArraySchema<Treasure>();
    @type({ map: Player }) players = new MapSchema<Player>();
}