// mein menu scene

var GameoverScene = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function MainMenu ()
    {
        Phaser.Scene.call(this, { key: 'gameover' });
    },

    preload: function ()
    {
        initGamePads(this,function(){});
    },

    create: function ()
    {


        let GameOverImg = this.add.sprite(game.canvas.width/2,game.canvas.height/2-300, 'GameOver');

        this.btnstart = this.addButton(game.canvas.width/2,game.canvas.height/2, 'button_sun', this.doStart, this, 0, 0, 0, 0);
        this.btnstart.setPipeline('GlowShader');
        this.glowTime = 0;

    },
    update: function(){
        glowPipeline.setFloat1('time', this.glowTime);
        this.glowTime += 0.05;
        updateGamePads();

        if(gamePad[0].checkButtonState('start') > 0 || gamePad[1].checkButtonState('start') > 0){
            this.doStart();
        }
    },	
	doStart: function ()
    {       
        location.reload();
       
    }

});