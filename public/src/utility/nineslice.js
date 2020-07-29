class NineSlice{
    constructor(scene,x,y,key,scaleW,scaleH){
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.th = scaleH;
        this.tw = scaleW
        //Create Slices from Image    
        //Center needs to be first so I can adjust around it.
        this.center = this.scene.add.image(x,y,key,4).setScale(scaleW,scaleH);

        this.tl = this.scene.add.image(this.center.getTopLeft().x,this.center.getTopLeft().y,key,0).setOrigin(1,1).setScale(scaleW,scaleH);
        this.tc = this.scene.add.image(this.center.getTopCenter().x,this.center.getTopCenter().y,key,1).setOrigin(0.5,1).setScale(scaleW,scaleH);
        this.tr = this.scene.add.image(this.center.getTopRight().x,this.center.getTopRight().y,key,2).setOrigin(0,1).setScale(scaleW,scaleH);
        this.left = this.scene.add.image(this.center.getLeftCenter().x,this.center.getLeftCenter().y,key,3).setOrigin(1,0.5).setScale(scaleW,scaleH);
        this.right = this.scene.add.image(this.center.getRightCenter().x,this.center.getRightCenter().y,key,5).setOrigin(0,0.5).setScale(scaleW,scaleH);
        this.bl = this.scene.add.image(this.center.getBottomLeft().x,this.center.getBottomLeft().y,key,6).setOrigin(1,0).setScale(scaleW,scaleH);
        this.bc = this.scene.add.image(this.center.getBottomCenter().x,this.center.getBottomCenter().y,key,7).setOrigin(0.5,0).setScale(scaleW,scaleH);
        this.br = this.scene.add.image(this.center.getBottomRight().x,this.center.getBottomRight().y,key,8).setOrigin(0,0).setScale(scaleW,scaleH);

    }
    reScale(w,h){
        let sqrScale = w > h ? h :w;
        this.tl.setScale(sqrScale);
        this.tc.setScale(w,sqrScale);
        this.tr.setScale(sqrScale);
        this.left.setScale(sqrScale,h);
        this.right.setScale(sqrScale,h);
        this.bl.setScale(sqrScale);
        this.bc.setScale(w,sqrScale);
        this.br.setScale(sqrScale);
        this.center.setScale(w,h);
        //Reposition items after rescale
        this.setPosition(this.x,this.y);
    }
    setPosition(x,y){
        this.x = x;
        this.y = y;
        this.center.setPosition(x,y);
        let tl = this.center.getTopLeft();
        let tc = this.center.getTopCenter();
        let tr = this.center.getTopRight();
        let lc = this.center.getLeftCenter();
        let rc = this.center.getRightCenter();
        let bl = this.center.getBottomLeft();
        let bc = this.center.getBottomCenter();
        let br = this.center.getBottomRight();

        
        this.tl.setPosition(tl.x,tl.y);
        this.tc.setPosition(tc.x,tc.y);
        this.tr.setPosition(tr.x,tr.y);
        this.left.setPosition(lc.x,lc.y);
        this.right.setPosition(rc.x,rc.y);
        this.bl.setPosition(bl.x,bl.y);
        this.bc.setPosition(bc.x,bc.y);
        this.br.setPosition(br.x,br.y);
    }
    openToScale(w,h,time){
        this.scene.tweens.add({
            targets: this,
            tw: w,   
            th: h,            
            ease: 'Linear',       
            duration: time,  
            onUpdate: function(tween,targets, ns){
                ns.reScale(ns.tw,ns.th);
            },
            onUpdateParams: [this],
            onComplete: function(tween, targets, ns){
                
            }, 
            onCompleteParams: [this],
        })
    }

}