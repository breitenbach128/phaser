class Boss extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'spider', 0)        
        scene.matter.world.add(this);
        scene.add.existing(this); 
        this.setActive(true);
        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        //Set Control Sensor - Player can't collide with mirrors, but bullets can. Sensor can detect player inputs.
        const coreArea =  Bodies.rectangle(0, 0, this.width*.5, this.height*.35, { chamfer: {radius: 5}, isSensor: false });
        this.sensors = {
            bottom: Bodies.rectangle(0, h * 0.18, w * 0.40, 2, { isSensor: true }),
            top: Bodies.rectangle(0, -h * 0.18, w * 0.40, 2, { isSensor: true }),
            left: Bodies.rectangle(-w * 0.25, 0, 2, h * 0.30, { isSensor: true }),
            right: Bodies.rectangle(w * 0.25, 0, 2, h * 0.30, { isSensor: true })
          };
        this.sensors.bottom.label = "SPIDER_BOTTOM";
        this.sensors.top.label = "SPIDER_TOP";
        this.sensors.left.label = "SPIDER_LEFT";
        this.sensors.right.label = "SPIDER_RIGHT";

        const mainBody = Body.create({
            parts: [coreArea, this.sensors.top, this.sensors.bottom, this.sensors.left, this.sensors.right],
            frictionStatic: 0,
            frictionAir: 0.00,
            friction: 0.5,
            restitution: 0.00,
            label: "Boss"
        });

        mainBody.render.sprite.xOffset = .51;
        mainBody.render.sprite.yOffset = .80;

        this
        .setExistingBody(mainBody)
        .setFixedRotation() 
        .setIgnoreGravity(true);  

        //Custom Props
        this.touching = {up:0,down:0,left:0,right:0};
        this.mv_speed = 1;
        this.fall_speed = .5;
        this.jump_speed = 2;
        this.gun = new Gun(60,1,120);
        this.aggroDis = 600;
        this.groundTile = {x:0,y:0, updated: false};//Current Ground Tile
        this.tilePos = {x:0,y:0};

        //Collision
        this.scene.matter.world.on('beforeupdate', function (event) {
            this.touching.left = 0;
            this.touching.right = 0;
            this.touching.up = 0;
            this.touching.down = 0;
        },this);

        this.scene.matterCollision.addOnCollideActive({
            objectA: [this.sensors.bottom,this.sensors.left,this.sensors.right,this.sensors.top],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                
              if (gameObjectB !== undefined && gameObjectB instanceof Phaser.Tilemaps.Tile) {
                // Now you know that gameObjectB is a Tile, so you can check the index, properties, etc.
                
                if (gameObjectB.properties.collides){
                    if(bodyA.label == "SPIDER_BOTTOM"){
                        gameObjectA.touching.down++;
                    }
                    if(bodyA.label == "SPIDER_RIGHT"){
                        gameObjectA.touching.right++;
                    }
                    if(bodyA.label == "SPIDER_LEFT"){
                        gameObjectA.touching.left++;
                    }
                    if(bodyA.label == "SPIDER_TOP"){
                        gameObjectA.touching.up++;
                    }
                } 
              }
              if (gameObjectB !== undefined &&
                (gameObjectB instanceof TMXPlatform
                || gameObjectB instanceof Barrier
                || gameObjectB instanceof TMXGate)) {   
                
                //handle plaform jumping allowance             
                if(bodyA.label == "SPIDER_BOTTOM"){
                    gameObjectA.touching.down++;
                }
                if(bodyA.label == "SPIDER_RIGHT"){
                    gameObjectA.touching.right++;
                }
                if(bodyA.label == "SPIDER_LEFT"){
                    gameObjectA.touching.left++;
                }
                if(bodyA.label == "SPIDER_TOP"){
                    gameObjectA.touching.up++;
                }                         
              } 
            }
        });

        //DEBUG
        
        this.debug = this.scene.add.text(this.x, this.y-16, 'bright', { resolution: 2,fontSize: '8px', fill: '#00FF00' });

        //Draw Point area debug
        this.debugTargetTile = this.scene.add.graphics();
        var thickness = 2;
        var alpha = 1;
        this.debugTargetTile.lineStyle(thickness, 0xffff00, alpha);
        this.debugTargetTile.strokeRect(0,0,32,32);

        this.debugTargetTileSelf = this.scene.add.graphics();
        this.debugTargetTileSelf.lineStyle(thickness, 0xff00ff, alpha);
        this.debugTargetTileSelf.strokeRect(0,0,32,32);

        this.debugScanTile = this.scene.add.graphics();
        this.debugScanTile.lineStyle(thickness, 0x00ffff, alpha);
        this.debugScanTile.strokeRect(0,0,32,32);

        

        //AI
        
        this.wanderDirections = {
            right:{x:1,y:0},
            left:{x:-1,y:0},
            up:{x:0,y:-1},
            down:{x:0,y:1}
        };
        this.wanderDirection = 1;//Clockwise
        this.falltime = 0;
        //this.attackDelay = this.scene.time.addEvent({ delay: 3000, callback: this.startAttack, callbackScope: this, loop: true });
        this.climbing = false;
        //this.climbDelay = this.scene.time.addEvent({ delay: 3000, callback: this.climbToTile, callbackScope: this, loop: false });
        this.jumping = false;
        //Tile AI
        this.targetMoveTile = null;
        this.firstTouchGround = false;
    }
    update(time, delta)
    {       
        //Update Position in Tiles for AI
        let tpX = this.tilePos.x = (this.x/32 << 0);
        let tpY = this.tilePos.y = (this.y/32 << 0);

        //Easy Access Variables
        let mv_speed = this.mv_speed;

        //Play Animation
        this.anims.play('boss-spider', true);

        //Write Debug Information
        this.debug.setPosition(this.x, this.y-64);
        let debugString = "L:"+String(this.touching.left)+" R:"+String(this.touching.right)+" U:"+String(this.touching.up)+" D:"+String(this.touching.down)
        +"\n wd:"+String(this.wanderDirection);
       
        ////////////////////////////////////////////////////////////
        //Debug target draw
        if(this.targetMoveTile != null){            
            this.debugTargetTile.x = this.targetMoveTile.x*32;
            this.debugTargetTile.y = this.targetMoveTile.y*32;

            debugString+="\n MTT:x"+String(this.targetMoveTile.x)+":"+String(this.targetMoveTile.y);      
        }

        debugString+="\n TPT:x"+String(tpX)+":"+String(tpY);  
        
        
        this.debugTargetTileSelf.x = tpX*32;
        this.debugTargetTileSelf.y = tpY*32;

        this.debug.setText(debugString);
        ////////////////////////////////////////////////////////////

        //Check for Player to attack
        let disToSolana = Phaser.Math.Distance.Between(this.x,this.y,solana.x,solana.y);
        if(disToSolana < this.aggroDis){
            //Update Gun
            if(this.gun){
                
                var bullet = bullets.get();
                if (bullet && this.gun.ready)//ROF(MS)
                {                
                    let bullet = bullets.get();
                    bullet.setCollidesWith([ CATEGORY.GROUND,CATEGORY.SOLID, CATEGORY.SOLANA ]);
                    bullet.setIgnoreGravity(false);
                    bullet.setFrame(16);
                    let effs = [(new bulletEffect('Stunned',1.0,60,1,'Anim','solana-webbed'))];
                    bullet.setEffects(effs);
                    if(this.wanderDirection == 1){
                        bullet.fire(this.x, this.y, 4, -4, 400);
                    }else{
                        bullet.fire(this.x, this.y, -4, -4, 400);
                    }
                    
                    this.gun.shoot();//Decrease mag size. Can leave this out for a constant ROF.
                }
                this.gun.update();
            }
        }
        //Movement
        let tleft = (this.touching.left > 0);
        let tRight = (this.touching.right > 0);
        let tDown = (this.touching.down > 0);
        let tUp = (this.touching.up > 0);
        let noTouch = (!tleft && !tRight && !tUp && !tDown);
        //Position
        let bodyMin = this.body.bounds.min;
        let bodyMax = this.body.bounds.max;
        let bodyWidth = bodyMax.x - bodyMin.x;
        let bodyHeight = bodyMax.y - bodyMin.y;
        //Body Velocities
        let bodyVelX = this.body.velocity.x;
        let bodyVelY = this.body.velocity.y;

        //Am I touching my target tile?
        if(this.targetMoveTile != null){
            if(this.targetMoveTile.x == tpX && this.targetMoveTile.y == tpY){

                //This is never being triggered because of the else statement and the fall/no sensor touch detection.

                //console.log("L:"+(bodyMin.x),"R:"+(bodyMax.x),"U:"+(bodyMin.y),"D:"+(bodyMax.y),(this.targetMoveTile.x)*32,(this.targetMoveTile.y)*32,this.wanderDirection);
                
                if(this.wanderDirection > 0){
                    if(bodyVelY == 0){
                        if(bodyVelX > 0){
                            if(bodyMin.x + bodyVelX >= (this.targetMoveTile.x)*32){
                                console.log("On Target Tile: Y:0",bodyVelX,bodyVelY);
                                this.setVelocity(0,1*mv_speed);
                                if(bodyVelX < 0){this.setVelocity(0,-1*mv_speed);}
                                this.targetMoveTile = null;
                            }
                        }else if(bodyVelX < 0){
                            if(bodyMax.x + bodyVelX <= (this.targetMoveTile.x+1)*32){
                                console.log("On Target Tile: Y:0",bodyVelX,bodyVelY);
                                this.setVelocity(0,-1*mv_speed);
                                this.targetMoveTile = null;
                            }
                        }

                    }else if(bodyVelX == 0){
                        if(bodyVelY > 0){
                            if(bodyMin.y + bodyVelY >= (this.targetMoveTile.y)*32){
                                console.log("On Target Til: X:0",bodyVelX,bodyVelY);
                                this.setVelocity(-1*mv_speed,0);
                                this.targetMoveTile = null;
                            }
                        }else if(bodyVelY < 0){
                            if(bodyMax.y + bodyVelY <= (this.targetMoveTile.y+1)*32){
                                console.log("On Target Til: X:0",bodyVelX,bodyVelY);
                                this.setVelocity(1*mv_speed,0);
                                this.targetMoveTile = null;
                            }
                        }
                    }

                }else if(this.wanderDirection < 0){
                    if(bodyMax.x + bodyVelX <= (this.targetMoveTile.x+1)*32 && bodyMax.y + bodyVelY <= (this.targetMoveTile.y+1)*32){
                        console.log("On Target Tile",bodyVelX,bodyVelY);

                        if(bodyVelX > 0 && bodyVelY == 0){this.setVelocityY(0,-1*mv_speed);}
                        if(bodyVelX < 0 && bodyVelY == 0){this.setVelocityY(0,1*mv_speed);}

                        if(bodyVelY > 0 && bodyVelX == 0){this.setVelocityX(1*mv_speed,0);}
                        if(bodyVelY < 0 && bodyVelX == 0){this.setVelocityX(-1*mv_speed,0);}

                        this.targetMoveTile = null;
                        
                    }
                }

                //this.findDestinationTile(tpX+OriginX_TileOffSet,tpY+OriginY_TileOffset,this.wanderDirection,0);

                //For this check, it needs to check the opposite movement side against the backside of the tile.
                //For example, if the spider is moving right (+X), he needs to check his left side to be equal/greater than
                //the tile left side. 

                //I also need to check and adjust the velocity(Mv_speed) dynamically to make sure the spider stops on the correct spot.
                //This might resolve the stopping issue, as I can check for if I am one frame away from the final movement required to be left to left sides
                //and then adjust the speed to make that happen

        }
        }

        if(this.climbing){
            //Climbing to Tile
            this.setVelocityX(0);
            this.setVelocityY(this.mv_speed*-1.5);
            if(tUp){
                this.climbing = false;
            }
        }else{
            //ON PLATFORM BEHAVIOR
            if(noTouch){
                //Airborne                
                this.falltime++;

            }else{
                if(!this.firstTouchGround){this.firstTouchGround =true;};
                if(this.jumping){
                    this.jumping = false;
                    this.setIgnoreGravity(true);
                }
                this.falltime = 0;

                //Now, check for corners to adjust wander direction. Add timer to keep it from spamming

                //Not falling, and no target picked
                if(this.targetMoveTile == null || (bodyVelX == 0 && bodyVelY == 0)){
                    let dirChoice = 'none';
                    let dirOffset = {x:0,y:0};
                    //Touch Left Directions
                    if(tleft && this.wanderDirection > 0){dirChoice = 'down';dirOffset={x:-1,y:0};};
                    if(tleft && this.wanderDirection < 0){dirChoice = 'up';dirOffset={x:-1,y:0};};
                    //Touch Right Directions
                    if(tRight && this.wanderDirection > 0){dirChoice = 'up';dirOffset={x:1,y:0};};
                    if(tRight && this.wanderDirection < 0){dirChoice = 'down';dirOffset={x:1,y:0};};
                    //Touch Up Directions
                    if(tUp && this.wanderDirection > 0){dirChoice = 'left';dirOffset={x:0,y:-1};};
                    if(tUp && this.wanderDirection < 0){dirChoice = 'right';dirOffset={x:0,y:-1};};
                    //Touch Down Directions
                    if(tDown && this.wanderDirection > 0){dirChoice = 'right';dirOffset={x:0,y:1};};
                    if(tDown && this.wanderDirection < 0){dirChoice = 'left';dirOffset={x:0,y:1};};
                    
                    //Catch corner checks NEED TO CHECK LOGIC
                    if(tleft && tUp){
                        if(this.wanderDirection > 0){
                            dirChoice = 'down';dirOffset={x:-1,y:0};
                        }else if(this.wanderDirection < 0){
                            dirChoice = 'right';dirOffset={x:0,y:-1};
                        }
                    };//UL
                    if(tRight && tUp){
                        if(this.wanderDirection > 0){
                            dirChoice = 'down';dirOffset={x:1,y:0};
                        }else if(this.wanderDirection < 0){
                            dirChoice = 'left';dirOffset={x:0,y:-1};
                        }
                    };//UR
                    if(tleft && tDown){
                        if(this.wanderDirection > 0){
                            dirChoice = 'right';dirOffset={x:0,y:1};
                        }else if(this.wanderDirection < 0){
                            dirChoice = 'up';dirOffset={x:1,y:0};
                        }
                    };//DL
                    if(tRight && tDown){
                        if(this.wanderDirection > 0){
                            dirChoice = 'up';dirOffset={x:1,y:0};
                        }else if(this.wanderDirection < 0){
                            dirChoice = 'left';dirOffset={x:0,y:-1};
                        }
                    };//DR

                    //Find new Tile
                    if(dirChoice != 'none'){
                        //local choice directions
                        let dVelX = this.wanderDirections[dirChoice].x;
                        let dVelY = this.wanderDirections[dirChoice].y;
                        //Set Velocity
                        this.setVelocity(dVelX*mv_speed,dVelY*mv_speed);
                        //Pick new Target Tile  
                        this.findDestinationTile(tpX,tpY,dVelX,dVelY,dirOffset.x,dirOffset.y);
                    }
                }



                // if(tleft){this.setVelocityY(mv_speed*this.wanderDirection);this.setVelocityX(mv_speed*-1);};
                // if(tRight){this.setVelocityY(mv_speed*this.wanderDirection*-1);this.setVelocityX(mv_speed);};
                // if(tUp){this.setVelocityX(mv_speed*this.wanderDirection*-1);};
                // if(tDown){this.setVelocityX(mv_speed*this.wanderDirection);};
                
            }

            //Set fall time
            if(this.falltime > 15 && !this.firstTouchGround){
                //this.setIgnoreGravity(false); 
                this.setVelocityY(this.fall_speed);
            }
        }
    }
    findDestinationTile(oX,oY,velX,velY,dOsX,dOsY){
        //Velocity should be set here.
        console.log("searching for new target tile");
        let checkTile = map.getTileAt(oX+velX+dOsX,oY+velY+dOsY, true, this.scene.collisionLayer)
        if(checkTile != null){  
            if(checkTile.index == -1){
                //Negate the offset, Adjusted Offset X and Y
                let adOsX = dOsX*-1;
                let adOsY = dOsY*-1;  
                   
                this.targetMoveTile = {x:checkTile.x+adOsX,y:checkTile.y+adOsY};//Hard coding offset for ground touch here. Need to check touching 
            }
            this.debugScanTile.x = checkTile.x*32;
            this.debugScanTile.y = checkTile.y*32;            
        }


        
    }
    climbToTile(){
        //Fire Projectile at ceiling. If hits a tile, then drawn line, and start climb.
        this.climbing = true;
        this.setIgnoreGravity(true);
        //If a tile is directly above the spider, they will stop, and spit a thread of silk at the platform and climb up to it to begin patrolling again.
        //If the player is above them, but not within LOS, they will do this as well.
    }
    startAttack(){
        if(!this.jumping){
            this.jumping = true;
            if(this.touching.up > 0){
                this.setVelocityY(this.jump_speed);
            }else{
                this.setVelocityY(-this.jump_speed);
            }
            if(this.canSee(solana)){
                if(solana.x < this.x){
                    this.wanderDirection = -1;
                    this.setVelocityX(-this.jump_speed*2);
                }else{
                    this.wanderDirection = 1;
                    this.setVelocityX(this.jump_speed*2);
                }
            }else{
                this.setVelocityX(this.jump_speed*this.wanderDirection);
            }
        }
    }
    canSee(target){
        let rayTo = Phaser.Physics.Matter.Matter.Query.ray(this.scene.matter.world.localWorld.bodies,{x:this.x,y:this.y},{x:target.x,y:target.y});
        if(rayTo.length < 3){
            //LOS Not Blocked
            //this.setIgnoreGravity(true); 
            
            //Check Ground, or Ceiling and jump accordingly.
            //Move left/right and then apply up or down. The falltime will take over and cause the fall after time.
            return true;
        }else{
            return false;
        }
        
    }
}


//SPIDER HIVE - BOSS # 1
//Spawns up to three spiders to chase player.
//Spawns every 15 seconds if there is room.
//Sprays webbing and acid every 5-10 seconds after a pulsating charge up.
//How to defeat?