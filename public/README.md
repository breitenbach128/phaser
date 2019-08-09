https://phasertutorials.com/creating-a-simple-multiplayer-game-in-phaser-3-with-an-authoritative-server-part-2/
Using this current tutorial on expanding my socket IO.

Lots to do. Need to craft the multiplayer from the ground up.


TWEEN SCOPE ISSUES
Two options:

tween.onCompleteCallback(doSomething);function doSomething () {// ...}
This method passes in a reference to the function, but has no context so you'll probably find loses scope. I would however do this:

tween.onComplete.add(doSomething, this)﻿;function doSomething﻿ () {// ...}
Which uses the Signals system built into Phaser and will retain scope.