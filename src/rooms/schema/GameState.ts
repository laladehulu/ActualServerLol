import { Room, Client, generateId } from "colyseus";
import { Schema, MapSchema, ArraySchema, Context } from "@colyseus/schema";
import e from "express";
enum NPCType {
    S_DeathKnight="S_DeathKnight", S_Warrior="S_Warrior"
}
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
    @type("string") quickaccess:string;
}
export class NPC extends Schema{
    constructor(id:string){
        super();
        this.npcID = id;
    }
    @type(V2) pos:V2 = new V2();
    @type(V2) mousePos:V2 = new V2();
 
    @type("number") health:number = 100;
    @type("string") team:string;
    @type("string") ownerID:string;
    @type("string") npcID:string;
    @type("string") type:string= NPCType.S_DeathKnight;

    isDefeated(){
        if(this.health<=0){
            return true;
        }
        return false;
    }
}
export class Territory extends Schema{
    constructor(id:string){
        super();
        this.id = id;
    }
    conquer(conquererTeam:string,changeCb:any){
        if(conquererTeam != this.owner){
            this.conquerPercentage-=3;
            if(this.conquerPercentage<=0){
                this.owner = conquererTeam;
                this.conquerPercentage = 1;
                changeCb(conquererTeam,this.id);
                return;
            }
        }
        else{
            if(this.conquerPercentage<100){
                this.conquerPercentage+=5;
            }
        }
        console.log(this.conquerPercentage)

    }
    
    @type("string") id:string = "default";
    @type("string") owner:string="default";
    @type("number") conquerPercentage:number=0;//100 for fully conquered
    //first the percentage must go down, and then the ownership will change

    
}
export class PlayerStat extends Schema{
    @type([ "string" ]) modifiers = new ArraySchema<string>();
    
}
export class Player extends Schema{
    @type(V2) pos:V2 = new V2();
    @type(V2) mousePos:V2 = new V2();
    @type("number") health:number = 100;
    @type("string") team:string = "default";
    @type("string") clientID:string;
    @type("string") name:string;
    @type("number") score: number = 0;
    @type(Inventory) inventory:Inventory = new Inventory();
    //@type(PlayerStat) stat:PlayerStat = new PlayerStat();
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
    @type({map: Territory}) territories = new MapSchema<Territory>();
    @type({ array: Treasure }) treasures = new ArraySchema<Treasure>();
    @type({ map: Player }) players = new MapSchema<Player>();
    @type({ map: NPC }) NPCs = new MapSchema<NPC>();
}