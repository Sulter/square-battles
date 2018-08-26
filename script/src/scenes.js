// Game scene
// -------------
// Runs the core gameplay loop
Crafty.scene('Game', function() {

  //create the map, add all tiles, the enemy base, players base. 
  Crafty.e('c_Tile_map');
  //the menu etc.
  Crafty.e('c_Spawn_units');
  
});

Crafty.scene('Game_over', function() {
  Crafty.e("2D, Canvas, Text").attr({ x:  (Game.width()/2), y: (Game.height()/2) }).text("GAME OVER, your score was etc.etc.etc.").textColor('#FF0000');
  setTimeout(function(){Crafty.scene('Main_menu')}, 5000);
});

Crafty.scene('Main_menu', function() {
  Crafty.e("2D, Canvas, spr_new_game, Mouse").attr({ x: (Game.width()/2)-93, y: (Game.height()/2)-36}).bind('MouseDown', function() {Crafty.scene('Game');})
  .bind('MouseOver', function() {this.toggleComponent("spr_new_game","spr_new_game_highlight");})
  .bind('MouseOut', function() {this.toggleComponent("spr_new_game","spr_new_game_highlight");});
  Crafty.e("2D, Canvas, Text").attr({ x: 10, y: 10 }).text(" -*Square Battles*- Pre-alpha. Hold LCtrl to keep building selected.");
  Crafty.e("2D, Canvas, spr_duplicator_enemy_unit").attr({ x: 10, y: 50 });
  Crafty.e("2D, Canvas, spr_exploder_enemy_unit").attr({ x: 10, y: 70 });
  Crafty.e("2D, Canvas, spr_runner_enemy_unit").attr({ x: 10, y: 90 });
  Crafty.e("2D, Canvas, spr_base").attr({ x: 10, y: 110 });
  Crafty.e("2D, Canvas, spr_teleporter").attr({ x: 10, y: 200 });
  Crafty.e("2D, Canvas, Text").attr({ x: 10, y: 50 }).text("Duplicator - can duplicate himself");
  Crafty.e("2D, Canvas, Text").attr({ x: 10, y: 70 }).text("Exploder - explodes with contact on anything");
  Crafty.e("2D, Canvas, Text").attr({ x: 10, y: 90 }).text("Runner - fast unit, that simply runs for the base. Low HP");
  Crafty.e("2D, Canvas, Text").attr({ x: 10, y: 110 }).text("Your caslte - defend it");
  Crafty.e("2D, Canvas, Text").attr({ x: 10, y: 200 }).text("Enemy warp gate - units spawn here");
});
 
// Loading scene
// -------------
// Handles the loading of binary assets such as images and audio files
Crafty.scene('Loading', function(){
    // Draw some text for the player to see in case the file
    //  takes a noticeable amount of time to load
 
    // Load our sprite map image
    Crafty.load([
        'assets/tiles.png',
        'assets/units.gif',
        'assets/menu.png',
		'assets/base.png',
        'assets/teleporter.png',
        'assets/main_menu.png',
        'assets/build_menu.png',
        'assets/context_bg.png',
        'assets/explosion.png',
        ], 
        function(){//done loading function
            // Once the images are loaded...
 
            // Define the individual sprites in the image
            // Each one (spr_tree, etc.) becomes a component
            // These components' names are prefixed with "spr_"
            //  to remind us that they simply cause the entity
            //  to be drawn with a certain sprite
            Crafty.sprite(16, 'assets/tiles.png', {
                spr_grass:    [0, 0],
                spr_wall:     [1, 0], 
                spr_shooter:  [2, 0],
            });
            
            Crafty.sprite(64, 'assets/explosion.png', {
                spr_explosion:    [0, 0],
            });
            
            Crafty.sprite(60, 'assets/context_bg.png', {
                spr_context_bg:    [0, 0],
            });
            
            Crafty.sprite('assets/build_menu.png', {
                spr_context_sell:    [0,0, 10, 19],
            });
            
            Crafty.sprite('assets/main_menu.png', {
                spr_new_game:    [0, 0, 371,73],
                spr_new_game_highlight:     [0, 73, 371, 71], 
            });
            
            Crafty.sprite(32, 'assets/teleporter.png', {
                spr_teleporter:    [0, 0],
            });
			
			Crafty.sprite(80, 'assets/base.png', {
                spr_base:    [0, 0],
            });
            
            Crafty.sprite(64, 'assets/menu.png', {
                spr_menu_archer_unit:   [0, 0],
                spr_menu_wall:          [1, 0],
                spr_menu_sword_unit:    [0, 1],
                spr_menu_rotator:       [1, 1],
                spr_menu_shooter:       [0, 2],
                spr_menu_skip:          [1, 2],
		spr_menu_spawner:       [0, 3],
            });
    
            Crafty.sprite(12, 'assets/units.gif', {
                spr_archer_unit:    [0, 0],
                spr_archer_enemy_unit:   [1, 0],
                spr_archer_unit_highlight:   [2, 0],
                spr_archer_enemy_unit_highlight:   [3, 0],
                spr_sword_unit:    [0, 1],
                spr_sword_enemy_unit:   [1, 1],
                spr_sword_unit_highlight:   [2, 1],
                spr_sword_enemy_unit_highlight:   [3, 1],
				spr_runner_enemy_unit:   [0, 2],
                spr_exploder_enemy_unit:   [1, 2],
                spr_duplicator_enemy_unit:   [2, 2],
            });

            // Now that our sprites are ready to draw, start the game
            Crafty.scene('Main_menu');
        }, 
        function(e){//while loading function (after each element)
            console.log(e.percent + "% Loading...");
        },
        function(e){//error while loading
            console.log(e); 
            alert('ERROR SOME ASSESTS COULD NOT BE LOADED!: ' + e.src)
    ;})
  
  
});
