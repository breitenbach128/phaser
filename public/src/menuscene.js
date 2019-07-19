// mein menu scene

var MainMenu = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function MainMenu ()
    {
        Phaser.Scene.call(this, { key: 'mainmenu' });
    },

    preload: function ()
    {
    },

    create: function ()
    {

		// add logo
		//this.sys.config.backgroundColor = '#f3cca3';
        //var logo = this.add.sprite(400, 200, 'sprites', 'phaser3');
        
        let title = this.add.sprite(0, 0, 'Title1');
        title.setPosition(game.canvas.width/2,title.height+128);

		// add start button
        //this.btnstart = this.addButton(0, 0, 'sprites', this.doStart, this, 'btn_play_hl', 'btn_play', 'btn_play_hl', 'btn_play');
        this.btnstart = this.addButton(0, 0, 'button_sun', this.doStart, this, 0, 0, 0, 0);
        this.btnstart.setPosition(game.canvas.width/2,400);
        
    },
    update: function(){
        
    },	
	doStart: function ()
    {
		this.scene.start('gamescene');
    }

});