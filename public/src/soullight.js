class SoulLight extends Phaser.GameObjects.Sprite {

    constructor(scene,x,y,owner) {
        super(scene, x,y, "soul_light")
        this.scene = scene;

        this.scene.physics.world.enable(this);
        this.scene.add.existing(this)
        this.body.setAllowGravity(false);

        this.owner = owner;
        this.ownerid = 1;
        this.create();
        this.debug = scene.add.text(this.x, this.y-16, 'SoulLight', { fontSize: '10px', fill: '#00FF00' });
    }

    create(){
        
        this.setActive(true);        
        this.passing = false;  
        this.threshhold_distance = 64;  
        this.move_speed = 10;
        this.base_speed = 10;
        this.max_speed = 120; 
        this.accel = 10;
        this.body.setDrag(40,40);

        this.protection_radius = 250;//How much does the light protect

    }

    update(time,delta)
    {
        this.passing = false;

        if(this.x <= this.owner.x-this.threshhold_distance){
            this.body.setVelocityX(this.move_speed);
            this.passing = true;
        }else if(this.x >= this.owner.x+this.threshhold_distance){
            this.body.setVelocityX(-this.move_speed);
            this.passing = true;
        }

        if(this.y <= this.owner.y-this.threshhold_distance){
            this.body.setVelocityY(this.move_speed);
            this.passing = true;
        }else if(this.y >= this.owner.y+this.threshhold_distance){
            this.body.setVelocityY(-this.move_speed);
            this.passing = true;
        }

        this.debug.setPosition(this.x+16, this.y-32);
        this.debug.setText("Passing:"+String(this.passing)
        +" \nSpeed:"+String(this.move_speed));

        if(this.passing){
            if(this.move_speed < this.max_speed){
                this.move_speed=this.move_speed+this.accel;
            }
        }else{
            if(this.move_speed > 0){
                this.move_speed=this.move_speed-this.accel;
            }
        }
    }
    

    passLight(target,id){
        this.ownerid = id;
        this.owner = target;
    }

}

