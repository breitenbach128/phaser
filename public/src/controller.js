class GamepadControl {
    constructor(gamepad){
        //Map the Controls to names
        if(gamepad == 0){
            gamepad = {id:1,buttons:[],axes:[]} //Load with empty values if pad is not valid
            for(var i=0;i<99;i++){
                gamepad.buttons[i]=0;
            }
            for(var i=0;i<2;i++){
                gamepad.axes[i]=0;
            }
        }

        this.pad = gamepad;
        
        //pad.buttons
        this.buttons = {
            up: this.pad.buttons[12],
            down: this.pad.buttons[13],
            left: this.pad.buttons[14],
            right: this.pad.buttons[15],
            shoot: this.pad.buttons[0], //A
            B: this.pad.buttons[1], //B
            jump: this.pad.buttons[2], //X
            Y: this.pad.buttons[3], //Y
            leftShoulder: this.pad.buttons[4], //Left Shoulder
            switchPlayer: this.pad.buttons[5], // Right Shoulder
            leftTrigger: this.pad.buttons[6], //Left Trigger
            rightTrigger: this.pad.buttons[7], // Right Trigger
            select : this.pad.buttons[8],
            start: this.pad.buttons[9],
            leftPush: this.pad.buttons[10],
            rightPush: this.pad.buttons[11]

        }
        //pad.axes
        this.sticks = {
            left : { x : this.pad.axes[0], y : this.pad.axes[1] },
            right: { x : this.pad.axes[2], y : this.pad.axes[3] }
        }
    }
}