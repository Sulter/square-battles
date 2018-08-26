Game = {
  // This defines our grid's size and the size of each of its tiles
    map_grid: {
            width:  50,
            height: 32,
        tile: {
            width:  16,
            height: 16
        }
    },
 
    // The total width of the game screen. Since our grid takes up the entire screen
    //  this is just the width of a tile times the width of the grid
    width: function() {
        return this.map_grid.width * this.map_grid.tile.width;
    },
 
    // The total height of the game screen. Since our grid takes up the entire screen
    //  this is just the height of a tile times the height of the grid
    height: function() {
        return this.map_grid.height * this.map_grid.tile.height;
    },
  
    scale_x: function() {
        return (this.map_grid.tile.width*this.map_grid.width)/Crafty.viewport.width;
    },
  
    scale_y: function() {
        return (this.map_grid.tile.height*this.map_grid.height+64)/Crafty.viewport.height;
    },
  
    make_globals: function(){
        this.enemy_alive = 0;
        this.gold = 1500;

	//Browser detection, should be robust. From: 
	//http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser?answertab=votes#tab-top
	this.isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
	// Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
	this.isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
	this.isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
	// At least Safari 3+: "[object HTMLElementConstructor]"
	this.isChrome = !!window.chrome && !this.isOpera;              // Chrome 1+
	this.isIE = /*@cc_on!@*/false || document.documentMode;   // At least IE6

        /*
        0 = walkable/buildable
        1 = not walkable/not buildable
        2 = walkable/not buildable
        */        
        this.occupied = new Array(Game.map_grid.width);
        for (var i = 0; i < Game.map_grid.width; i++) {
            this.occupied[i] = new Array(Game.map_grid.height);
            for (var y = 0; y < Game.map_grid.height; y++) {
                this.occupied[i][y] = 0;
            }
        }
    },
 
    // Initialize and start our game
    start: function() { 
        // Start crafty and init box2d world
        Crafty.init(Game.width(), Game.height()+64);
        Crafty.Box2D.init({gravityX:0, gravityY:0, scale:30, doSleep:true});    
        console.log('craft v: ' + Crafty.getVersion());
        console.log('games runs at: ' + Crafty.timer.getFPS() + 'fps'); 
 
        // Simply start the "Loading" scene to get things going
        Crafty.scene('Loading');
    }
}
