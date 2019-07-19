class GameItem extends Phaser.GameObjects.Sprite {
    constructor(scene,x,y,texture,frame) {
        super(scene, x, y, texture, frame);
        this.scene = scene;
        scene.add.existing(this); 

        //Item Properties
        this.name = "item";
        this.level = 0;//0 Not Equiped
        this.description = "An item";
    }
    setup(name,level,desc){
        this.name = name;
        this.level = level;//0 Not Equiped
        this.description = desc;
    }
}

class Inventory {
    constructor(scene){
        var gameItems = ["Wand","Crown","Wings","Belt"];
        let scale = 3;
        let imgSize = 32;
        let itemCount = 4;
        this.list = [];
        let gameCenter = game.canvas.width/2;
        let gameBottom = game.canvas.height;
        let invPosX = gameCenter - ((imgSize*scale*itemCount)/2);//Center inventory draw
        for(let i=0;i<itemCount;i++){
            let newBG = scene.add.image(invPosX+i*(imgSize*scale),gameBottom-64,'gameitems',4).setScale(scale);
            let newItem = new GameItem(scene,invPosX+i*(imgSize*scale),gameBottom-64,'gameitems',i);
            newItem.setup(gameItems[i],0,gameItems[i]);
            newItem.setScale(3);
            newItem.setTint(0x000000); //Tint Black since it is not equiped yet.
            this.list.push({
                bg:newBG,
                item:newItem,
                equiped:false
            });
        }
    }
    equipItem(){

    }
}

class EquipItem extends Phaser.Physics.Matter.Image {1
    constructor(scene,x,y,texture,frame) {
        super(scene.matter.world, x, y, texture, frame);
        this.scene = scene;
        // Create the physics-based sprite that we will move around and animate
        scene.matter.world.add(this);
        // config.scene.sys.displayList.add(this);
        // config.scene.sys.updateList.add(this);
        scene.add.existing(this); // This adds to the two listings of update and display.

        this.setActive(true);

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        const mainBody =  Bodies.rectangle(0, 0, w, h, { isSensor: true });
        
        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.1
        });

        this
        .setExistingBody(compoundBody)
        .setPosition(x, y)
        .setStatic(true)
        .setFixedRotation() // Sets inertia to infinity so the player can't rotate
        .setIgnoreGravity(true)
        .setVisible(true);  

        this.brightness = brigthness;
    }

    create(){
        
        this.setActive(true);      
  
    }

    update()
    {

    }

}