// The Grid component allows an element to be located
//  on a grid of tiles
Crafty.c('c_Grid', {
    init: function() {
        this.attr({
        w: Game.map_grid.tile.width,
        h: Game.map_grid.tile.height
    })
  },
 
  // Locate this entity at the given position on the grid
    at: function(x, y) {
        if (x === undefined && y === undefined) {
            return { x: this.x/Game.map_grid.tile.width, y: this.y/Game.map_grid.tile.height }
        } else {
            this.attr({ x: x * Game.map_grid.tile.width, y: y * Game.map_grid.tile.height });
            return this;
        }
    }
});


//the map
Crafty.c('c_Tile_map',{
    init: function(){
    
        //make the globals
        Game.make_globals();
        
        //we set the tress at the edge of the map, and set grass everywhere else
        for (var x = 0; x < Game.map_grid.width; x++) {
        for (var y = 0; y < Game.map_grid.height; y++) {
           Crafty.e('c_Grass').at(x,y);

            var at_edge = x == 0 || x == Game.map_grid.width - 1 || y == 0 || y == Game.map_grid.height - 1;
 
            if (at_edge) {
                // Place "atrap" walls around the edge
                Crafty.e('c_Wall_edge').at(x, y);
                Game.occupied[x][y] = 1;
            }
        }
        }

        //add menu-buttons
        Crafty.e('c_button1');
        Crafty.e('c_button2');
        Crafty.e('c_button3');
        Crafty.e('c_button4');
        Crafty.e('c_button5');
        Crafty.e('c_button6');
        
        //add physical boundaries around the map (maybe just change it to edge, and don't add a crafty type?):
        //top
        Crafty.e("Box2D").attr({ x: 0, y: 0, type: "static", w: Game.width(), h:Game.map_grid.tile.height});
        //bot
        Crafty.e("Box2D").attr({ x: 0, y: Game.height()-Game.map_grid.tile.height, type: "static", w: Game.width(), h:Game.map_grid.tile.height});
        //left
        Crafty.e("Box2D").attr({ x: 0, y: 0, type: "static", w: Game.map_grid.tile.width, h:Game.height()});
        //right
        Crafty.e("Box2D").attr({ x: Game.width()-Game.map_grid.tile.width, y: 0, type: "static", w: Game.map_grid.tile.width, h:Game.height()});    
        
        //make the base
        Crafty.e('c_base');
        //make the enemy spawner
        Crafty.e('c_enemy_spawner');

    },
});

// A grass tile
Crafty.c('c_Grass', {
    init: function() {
        this.requires('2D, Canvas, c_Grid,spr_grass');
    },
});

// A simple edge tile (not actually a wall!)
Crafty.c('c_Wall_edge', {
    init: function() {
        this.requires('2D, Canvas, c_Grid,spr_wall');
    },
});

//spawn units/builder component
Crafty.c('c_Spawn_units', {
    init: function() {
        this.requires('2D, Mouse, Keyboard, c_floodfill');
        this.attr({ w: Game.width(), h: Game.height() });
        
        this.bind('EnterFrame', function(){
            if(this.mouse_is_down){
		var activeButton = typeof Crafty.lastEvent.buttons === "number" ? Crafty.lastEvent.buttons : Crafty.lastEvent.which;
                if(activeButton == 0){
		    this.mouse_got_up();
                }else{
                    this.rec_ref.attr({x: Math.min(this.last_l_mouse_x,Crafty.lastEvent.realX) , y: Math.min(this.last_l_mouse_y,Crafty.lastEvent.realY), w: Math.abs(this.last_l_mouse_x-Crafty.lastEvent.realX),h: Math.abs(this.last_l_mouse_y-Crafty.lastEvent.realY)});
                }
            }else if(this.mode_ref != undefined){
                this.mode_ref.build_cue.attr({x:Math.floor(Crafty.lastEvent.realX/Game.map_grid.tile.width)*Game.map_grid.tile.width, y: Math.floor(Crafty.lastEvent.realY/Game.map_grid.tile.height)*Game.map_grid.tile.height, w: 16,h: 16});
            }
        });
        
        //variables used by unit selection/goal giving
        this.last_mouse_x = 0;
        this.last_mouse_y = 0;
        this.last_click_time =0; //at what utc time last right click was
        this.time_left_clicked = 2000; //last time left clicked, for the drag-select
        this.last_l_mouse_x = 0;
        this.last_l_mouse_y = 0;
        this.mouse_is_down = false; //for knowing when to draw the drag-select thing
        this.rec_ref = Crafty.e("2D, Canvas, Color");
        
        //mode gives reference to the current menu-button clicked. So it can call the building function 
        this.mode_ref;
        this.ctrl_is_down = false;
        
        this.bind('MouseDown', function(e) {
            //we create a unit where we click (we should propably check for collision - or at least map boundaries!)
            var activeButton = typeof Crafty.lastEvent.buttons === "number" ? Crafty.lastEvent.buttons : Crafty.lastEvent.which;
            if(activeButton == 1){//left click

                this.last_l_mouse_x = e.realX;
                this.last_l_mouse_y = e.realY;
                var d = new Date();
                this.time_left_clicked = d.getTime();
                
                if(this.mode_ref == undefined && !this.isDown('CTRL')){//check if there is any chosen buildings right now, if there isn't, untoggle units (but only if ctrl isn't down), otherwise build it
                    Crafty.trigger('untoggle_unit');
                    this.rec_ref = Crafty.e("2D, Canvas, Color").color('rgba(0, 0, 0,0.5)');
                    this.mouse_is_down = true;
                }else if(this.mode_ref == undefined){
                    //used for the drag-select
                    this.rec_ref = Crafty.e("2D, Canvas, Color").color('rgba(0, 0, 0,0.5)');
                    this.mouse_is_down = true;
                }else if(this.mode_ref != undefined){
                switch(this.mode_ref.mode)//the building-switch
                {

                    case 2://place a wall      
                        //first we check if we can even afford it
                        if(Game.gold < 5){
                            Crafty.e('c_error_message').setup("Can't afford it");
                            this.mode_ref.build_cue.destroy();
                            delete this.mode_ref;
                            break;
                        }
                        var tile_x = Math.floor(e.realX/Game.map_grid.tile.width);
                        var tile_y = Math.floor(e.realY/Game.map_grid.tile.height);
                        //we make sure that this tile isn't already occupied
                        if(!Game.occupied[tile_x][tile_y] && !this.mode_ref.cd_ref.on_cd){
                            //since it isn't occupied, we also do the flood fill, to be sure we are not enclosing walkable tiles!
                            if(this.do_flood_fill(tile_x, tile_y)){
                                //create the wall building
                                Crafty.e('c_Wall').setup(tile_x*Game.map_grid.tile.width, tile_y*Game.map_grid.tile.height);
                                //also recalc the path for all units
                                Crafty.trigger('recalc_path');
                                //callback for the button that it has been builed
                                this.mode_ref.cd_ref.start(this.mode_ref.x, this.mode_ref.y, this.mode_ref.cd_time);
                                
                                //since you have build something - untoggle all units
                                Crafty.trigger('untoggle_unit');
                                
                                if(!this.isDown('CTRL')){//if control isn't pressed, delete the referance
                                    this.mode_ref.build_cue.destroy();
                                    delete this.mode_ref;
                                }
                            }
                            else
                                Crafty.e('c_error_message').setup("Blocking path!");
                                
                        }
                        break;
                    case 3://place the rotator   
                        //first we check if we can even afford it
                        if(Game.gold < 10){
                            Crafty.e('c_error_message').setup("Can't afford it");
                            this.mode_ref.build_cue.destroy();
                            delete this.mode_ref;
                            break;
                        }
                        var tile_x = Math.floor(e.realX/Game.map_grid.tile.width);
                        var tile_y = Math.floor(e.realY/Game.map_grid.tile.height);
                        if(!Game.occupied[tile_x][tile_y] && !Game.occupied[tile_x-1][tile_y] && !Game.occupied[tile_x][tile_y-1] && !Game.occupied[tile_x+1][tile_y]
                        && !Game.occupied[tile_x][tile_y+1] && !Game.occupied[tile_x-1][tile_y-1] && !Game.occupied[tile_x-1][tile_y+1] && !Game.occupied[tile_x+1][tile_y-1]
                        && !Game.occupied[tile_x+1][tile_y+1] && !this.mode_ref.cd_ref.on_cd){
                            Crafty.e("c_Rotator").setup(tile_x*Game.map_grid.tile.width+8, tile_y*Game.map_grid.tile.height+8);
                            this.mode_ref.cd_ref.start(this.mode_ref.x, this.mode_ref.y, this.mode_ref.cd_time);
                            
                            //since you have build something - untoggle all units
                            Crafty.trigger('untoggle_unit');
                            
                            if(!this.isDown('CTRL')){//if control isn't pressed, delete the referance
                                this.mode_ref.build_cue.destroy();
                                delete this.mode_ref;
                            }
                        }
                        
                        break;
                    case 4://place a shooter    
                        //first we check if we can even afford it
                        if(Game.gold < 25){
                            Crafty.e('c_error_message').setup("Can't afford it");
                            this.mode_ref.build_cue.destroy();
                            delete this.mode_ref;
                            break;
                        }
                        var tile_x = Math.floor(e.realX/Game.map_grid.tile.width);
                        var tile_y = Math.floor(e.realY/Game.map_grid.tile.height);
                        //we make sure that this tile isn't already occupied
                        if(!Game.occupied[tile_x][tile_y] && !this.mode_ref.cd_ref.on_cd){
                            //since it isn't occupied, we also do the flood fill, to be sure we are not enclosing walkable tiles!
                            if(this.do_flood_fill(tile_x, tile_y)){              
                                Crafty.e("c_Shooter").setup(tile_x*Game.map_grid.tile.width, tile_y*Game.map_grid.tile.height);
                                //recalc the path for all units after making the tile unwalkable
                                Game.occupied[tile_x][tile_y] = 1;
                                Crafty.trigger('recalc_path');
                                //callback for the button that it has been builed
                                this.mode_ref.cd_ref.start(this.mode_ref.x, this.mode_ref.y, this.mode_ref.cd_time);
                                
                                //since you have build something - untoggle all units
                                Crafty.trigger('untoggle_unit');
                                
                                if(!this.isDown('CTRL')){//if control isn't pressed, delete the referance
                                    delete this.mode_ref;
                                }
                            }
                            else
                                Crafty.e('c_error_message').setup("Blocking path!");
                        }
                        break;
                }  
                }
            }
            else if((activeButton == 2 && !Game.isChrome) || (Game.isChrome && activeButton == 3)){   //right click 
                //delete current ref to building
                if(this.mode_ref != undefined){
                    this.mode_ref.build_cue.destroy();
                    delete this.mode_ref;
                }
                
                //for path finding of units
                this.last_click_time;
                this.last_mouse_x = e.realX;
                this.last_mouse_y = e.realY;
                var d = new Date();
                this.last_click_time = d.getTime();
            }
                
            
        }),
        this.areaMap([0,0], [Game.width(),0], [Game.width(),Game.height()], [0,Game.height()]);
        this.bind('get_x_and_y', function(dat){dat.y = this.last_mouse_y ^0; dat.x = this.last_mouse_x ^0; dat.last_time = this.last_click_time;});
        //change between different setting of
        this.bind('change_mode', function(data){if(this.mode_ref != undefined){this.mode_ref.build_cue.destroy();}this.mode_ref = data;});
       
    },
    
    mouse_got_up: function(){
        this.rec_ref.destroy();
                this.mouse_is_down = false;
                //we query from box2d in the area:
                var aabb = new Box2D.Collision.b2AABB;
                var low = new Box2D.Common.Math.b2Vec2;
                var high = new Box2D.Common.Math.b2Vec2;
                low.Set(Math.min(Crafty.lastEvent.realX,this.last_l_mouse_x)/30, Math.min(Crafty.lastEvent.realY,this.last_l_mouse_y)/30);
                high.Set(Math.max(Crafty.lastEvent.realX,this.last_l_mouse_x)/30, Math.max(Crafty.lastEvent.realY,this.last_l_mouse_y)/30);
                aabb.lowerBound = low;
                aabb.upperBound = high;
                Crafty.Box2D.world.QueryAABB(function(fix){
                    if(Crafty(fix.GetBody().GetUserData()).team == "player" && fix.GetUserData() == "body_fix" ){
                        Crafty(fix.GetBody().GetUserData()).drag_selected();
                    }
                    return true;
                }, aabb);  
    
    },
  
});

//menu button 1
Crafty.c('c_button1', { //changes spawn units to 0 on click
    init: function() {
        this.mode = 0;
        this.requires('2D, Canvas, Mouse, spr_menu_archer_unit');
        this.attr({ x: 0, y: Game.height() });
        //cooldown "shower"-hue, and the timer variable
        this.cd_time = 50*2;
        this.cd_ref = Crafty.e('c_cd_shower');
        
        this.bind('MouseDown', function(e) { if(!this.cd_ref.on_cd){
            if(Game.gold >= 35){
                Crafty.e('c_Archer_unit').setup(50+90, 400+40, "player");
                this.cd_ref.start(this.x, this.y, this.cd_time);
                Game.gold -=35;
            }
            else
                Crafty.e('c_error_message').setup("Can't afford it");
        }}); 
    },
});

//menu button 2
Crafty.c('c_button2', { //changes spawn units to 1 on click
    init: function() {
        this.mode = 1;
        this.requires('2D, Canvas, Mouse, spr_menu_sword_unit');
        this.attr({ x: this.w, y: Game.height() });
        //cooldown "shower"-hue, and the timer variable
        this.cd_time = 50*2;
        this.cd_ref = Crafty.e('c_cd_shower');
        
        this.bind('MouseDown', function(e) { if(!this.cd_ref.on_cd){
            if(Game.gold >= 20){
                Crafty.e('c_Sword_unit').setup(50+90, 400+40, "player");
                this.cd_ref.start(this.x, this.y, this.cd_time);
                Game.gold -=20;
            }
            else
                Crafty.e('c_error_message').setup("Can't afford it");
        }}); 
    },
});
//menu button 3
Crafty.c('c_button3', { //changes spawn units to 2 on click
    init: function() {
        this.mode = 2;
        this.build_cue;
        this.requires('2D, Canvas, Mouse, spr_menu_wall');
        this.attr({ x: this.w*2, y: Game.height() });
        //cooldown "shower"-hue, and the timer variable
        this.cd_time = 50*0.5;
        this.cd_ref = Crafty.e('c_cd_shower');
        
        this.bind('MouseDown', function(e) {Crafty.trigger('change_mode', this); this.build_cue = Crafty.e("2D, Canvas, Color");}); 
    },
});
//menu button 4
Crafty.c('c_button4', { //changes spawn units to 3 on click
    init: function() {
        this.mode = 3;
        this.requires('2D, Canvas, Mouse, spr_menu_rotator');
        this.attr({ x: this.w*3, y: Game.height() });
        //cooldown "shower"-hue, and the timer variable
        this.cd_time = 50*1;
        this.cd_ref = Crafty.e('c_cd_shower');
        
        this.bind('MouseDown', function(e) {Crafty.trigger('change_mode', this); this.build_cue = Crafty.e("2D, Canvas, Color");}); 
         
  },
});

//menu button 5
Crafty.c('c_button5', { //changes spawn units to 4 on click
    init: function() {
        this.mode = 4;
        this.requires('2D, Canvas, Mouse, spr_menu_shooter');
        this.attr({ x: this.w*4, y: Game.height() });
        //cooldown "shower"-hue, and the timer variable
        this.cd_time = 50*1;
        this.cd_ref = Crafty.e('c_cd_shower');
        
        this.bind('MouseDown', function(e) {Crafty.trigger('change_mode', this); this.build_cue = Crafty.e("2D, Canvas, Color");}); 
  },
});

//menu button 6
Crafty.c('c_button6', { //changes spawn units to 4 on click
    init: function() {
        this.mode = 4;
        this.requires('2D, Canvas, Mouse, spr_menu_skip');
        this.attr({ x: this.w*5, y: Game.height() });
        this.bind('MouseDown', function(e) {Crafty.trigger('skip_wave', this);}); 
  },
});

Crafty.c('c_cd_shower', { //shows the cooldown on the buildings/units
    init: function() {
        this.requires('2D, Canvas, Color');
        this.color("rgba(0,0,0,0.55)");
        this.attr({ x: 100, y: 100, w: 64, h:0});
        this.frame_counter = 0;
        this.on_cd = false;
        this.cd_timer = 0;
        
        this.bind('EnterFrame', function(){
            if(this.on_cd){
                this.frame_counter++;
                var perc = 64 - Math.round(64*(this.frame_counter/this.cd_time));
                if(perc >= 0)
                    this.h = perc;
                if(this.frame_counter > this.cd_time)
                    this.on_cd = false;
            }
        });
    },
    
    start: function(x, y, cd){
        this.x = x;
        this.y = y;
        this.cd_time = cd;
        
        this.frame_counter = 0;
        this.on_cd = true;
        this.h = 64.
    },
});

Crafty.c('c_Arrow', {
    init: function() {
        this.requires('Box2D, Canvas, Color');
        this.color('black');
        this.frame_alive = 0;
        this.max_frame_alive = 50*3;
        this.onHit("Box2D", this.stick_into_it);
        this.bind('EnterFrame', function(){
            this.frame_alive++;
            if(this.frame_alive > this.max_frame_alive)
                this.destroy();
        });
    },
    setup: function(x, y, angle){
        this.attr({ x: Math.round(x), y: Math.round(y), w:9, h:1, type: "dynamic"});  
        this.body.SetAngularDamping(1);
        this.body.SetLinearDamping(0.5);   
        var body_fixture = new Box2D.Dynamics.b2Fixture;
        body_fixture = this.body.GetFixtureList();
        body_fixture.SetUserData('Arrow');
        body_fixture.SetDensity(30);
        this.body.ResetMassData();
        //remeber to set the arrow as a bullet, as it travels so fast
        this.body.SetBullet(true);
        
        //rotate the arrow in the right direction
        this.body.SetPositionAndAngle( this.body.GetPosition(), angle);
        
        //launch the arrow
        var launch_energy = 4;
        var x_f=Math.cos(angle)*launch_energy;
        var y_f=Math.sin(angle)*launch_energy;
            
        var impulse = new Box2D.Common.Math.b2Vec2(x_f,y_f);
        this.body.ApplyImpulse(impulse, this.body.GetWorldCenter());
        
        
    
    },
    
    stick_into_it: function(data){
    
    //first we make sure that both are NOT arrows
    if(data[0].fixA.GetUserData() != "Arrow" || data[0].fixB.GetUserData() != "Arrow")
        
        if(data[0].fixA.GetUserData() != "sensor_cirkel" && data[0].fixB.GetUserData() != "sensor_cirkel"){
            //console.log('arrow speed at impact: ' + (Math.abs(this.body.GetLinearVelocity().x)+Math.abs(this.body.GetLinearVelocity().y)));
            //console.log('angular speed: ' + this.body.GetAngularVelocity());
            //we  first check for impact speed AND angular velocity too (rotating arrows shouldn't stick into anything)          
            if((Math.abs(this.body.GetLinearVelocity().x)+Math.abs(this.body.GetLinearVelocity().y)) > 4 && this.body.GetAngularVelocity() < 0.2 && this.body.GetAngularVelocity() > -0.2){
                
                if(data[0].obj.body != null){//just make sure that the object haven't been destroyed by chance in this frame already!
                    //since we hit something, and the speeds are good, we should stick to it
                    
                    //first we just rename the arrow, so it can't damage/stick to anyone new
                    var body_fixture = new Box2D.Dynamics.b2Fixture;
                    body_fixture = this.body.GetFixtureList();
                    //body_fixture.SetUserData('Arrow_stuck'); CURRENT DISABLED
                    
                    //now all the actual welding:
                    var worldCoordsAnchorPoint = new Box2D.Common.Math.b2Vec2;
            
                    worldCoordsAnchorPoint = this.body.GetWorldCenter();
            
                    var weldJointDef = new Box2D.Dynamics.Joints.b2WeldJointDef;            
                    weldJointDef.bodyA = data[0].obj.body;
           
                    weldJointDef.bodyB = this.body;
                    weldJointDef.localAnchorA = weldJointDef.bodyA.GetLocalPoint( worldCoordsAnchorPoint );
                    weldJointDef.localAnchorB = weldJointDef.bodyB.GetLocalPoint( worldCoordsAnchorPoint );
                    weldJointDef.referenceAngle = weldJointDef.bodyB.GetAngle() - weldJointDef.bodyA.GetAngle();
                    Crafty.Box2D.world.CreateJoint(weldJointDef);
                }
            }
            
            
        }
    }
  
});

Crafty.c('c_hp_bar', { 
    setup: function(x, y){
        this.requires('2D, Canvas, Color');
        this.attr({ x: x, y: y, w:16, h:2, z:20});
        this.color('red');
    },
    update_bar_position: function(x, y){
        this.x = Math.round(x - 8);
        this.y = Math.round(y - 18);
    },
    update_bar_size: function(percent){
            if(percent < 1 && percent > 0){
                var new_w = Math.round(16 * percent);
                this.w = new_w;
            }
    },    
});

//The base
Crafty.c('c_base', {
    init: function() {
        this.requires('Box2D, Canvas, spr_base, c_wall_filler');
        this.attr({ x: 50, y: 400, w:80, h:80});
        this.LIVES = 10;
        
        this.onHit("Box2D", this.base_collision);
        this.live_show = Crafty.e("c_lives_shower");
        
        //make sure there can't be build around the spawner, or inside it
        var tile_x = Math.floor(this.x/Game.map_grid.tile.width);
        var tile_y = Math.floor(this.y/Game.map_grid.tile.height);
        this.fill_in(tile_x, tile_y, 5,5,2);
    },
    
    base_collision: function(data){
        if(data[0].obj.team == "enemy"){
            if(data[0].fixA.GetUserData() != "sensor_cirkel" && data[0].fixB.GetUserData() != "sensor_cirkel"){
                //an enemy have touched our base - destroy it by setting hp to 0, and we lost a HP point, so update the live show
                data[0].obj.current_hp = 0;
                this.LIVES --;
                if(this.LIVES <0)
                    Crafty.scene('Game_over');
                this.live_show.update(this.LIVES);
            }
        }
    
    },
});

Crafty.c('c_lives_shower', {
    init: function() {
        this.requires('2D, DOM, Text');
        this.attr({ x: 580, y: 525});
        this.text("Lives: 10");
        this.textColor("#FF0000");
    },
    
    update: function(lives){
        this.text(function(){return "Lives: " + lives});
    },
});

//Enemy spawner
Crafty.c('c_enemy_spawner', {
    init: function() {
        this.requires('2D, Canvas, Mouse, spr_teleporter, SpriteAnimation, c_wall_filler');
        this.attr({ x: 750, y: 25, w:32, h:32, z:2});
        this.animate('animation', 0, 0, 18);
        this.animate('animation', 48, -1);
        //we spawn a random enemy whenever the spawner is being clicked on, for testing purposes
	this.bind('MouseDown', function(e){
	    var rand = Math.floor((Math.random()*100)+1);
            if(rand < 30){
                Crafty.e('c_Exploder_unit').setup(this.x+8, this.y+8, "enemy");
                Game.enemy_alive++;
            }
	    else if(rand < 60){
                Crafty.e('c_Duplicator_unit').setup(this.x+8, this.y+8, "enemy");
                Game.enemy_alive++;
            }
            else if(rand < 100){
                Crafty.e('c_Runner_unit').setup(this.x+8, this.y+8, "enemy");
                Game.enemy_alive++;
            }   
	}); 

        //make sure there can't be build around the spawner
        var tile_x = Math.floor(this.x/Game.map_grid.tile.width);
        var tile_y = Math.floor(this.y/Game.map_grid.tile.height);
        this.fill_in(tile_x, tile_y, 3,3,2);
        
        //fired by the skip-button
        this.bind('skip_wave', function(e) {if(this.wave_cd_ref.time > 5*50)  this.wave_cd_ref.time = 5*50;}); 
        
        //the wave countdown text ref
        this.wave_cd_ref = Crafty.e("c_wave_shower");
        Crafty.e('c_gold_shower');
        //wave definitions
        function wave(wave_nr, exploders, duplicators, runners, spawn_interval, total_units){
            this.wave_nr=wave_nr;
            this.exploders=exploders;
            this.duplicators=duplicators;
            this.runners=runners;
            this.total_units = total_units;
            this.spawn_interval = spawn_interval;
        }
        this.current_wave_nr = 0;
        this.units_spawned_counter = 0;
        this.wave_array = new Array();
        //wave muck up (number of units etc.)
        this.wave_array.push(new wave(0, 0,0,100, 50*5, 3));
        this.wave_array.push(new wave(1, 0,10,100, 50*4, 5));
        this.wave_array.push(new wave(2, 0,20,100, 50*4, 5));
        this.wave_array.push(new wave(3, 0,20,100, 50*4, 8));
        this.wave_array.push(new wave(4, 10,20,100, 50*4, 10));
        this.wave_array.push(new wave(5, 10,20,100, 50*4, 15));
        
        this.wave_array.push(new wave(6, 20,40,100, 50*4, 20));
        this.wave_array.push(new wave(7, 20,40,100, 50*4, 25));
        this.wave_array.push(new wave(8, 20,40,100, 50*4, 30));
        this.wave_array.push(new wave(9, 20,40,100, 50*3, 35));
        this.wave_array.push(new wave(10, 20,40,100, 50*3, 35));
        this.wave_array.push(new wave(11, 20,40,100, 50*3, 35));
        this.wave_array.push(new wave(12, 20,40,100, 50*3, 35));
        this.wave_array.push(new wave(13, 20,40,100, 50*3, 35));
        //enemy spawning
        var frame_count = 0;
        //start the wave cd, after which, wave 0 will start
        this.wave_cd_ref.start_in(50*30, this.current_wave_nr);
        
        this.bind('EnterFrame', function(){
            frame_count++;
            if(frame_count > this.wave_array[this.current_wave_nr].spawn_interval && this.wave_cd_ref.time == 0 && this.units_spawned_counter < this.wave_array[this.current_wave_nr].total_units){
                var rand = Math.floor((Math.random()*100)+1);
                if(rand < this.wave_array[this.current_wave_nr].exploders){
                    Crafty.e('c_Exploder_unit').setup(this.x+8, this.y+8, "enemy");
                    Game.enemy_alive++;
                }
                else if(rand < this.wave_array[this.current_wave_nr].duplicators){
                    Crafty.e('c_Duplicator_unit').setup(this.x+8, this.y+8, "enemy");
                    Game.enemy_alive++;
                }
                else if(rand < this.wave_array[this.current_wave_nr].runners){
                    Crafty.e('c_Runner_unit').setup(this.x+8, this.y+8, "enemy");
                    Game.enemy_alive++;
                }   
                frame_count = 0;
                this.units_spawned_counter++;
            }
            if(this.units_spawned_counter >= this.wave_array[this.current_wave_nr].total_units && Game.enemy_alive == 0){
                this.next_wave();
                this.wave_cd_ref.start_in(50*30, this.current_wave_nr);  
            }
        });
    },
    
    next_wave: function(){
        this.units_spawned_counter = 0;
        this.current_wave_nr++;
        Game.gold += 10*this.current_wave_nr;
        if(this.current_wave_nr >= this.wave_array.length)
            Crafty.scene('Main_menu');
    }
});

//simple component for filling in walls, usefull for bigger buildings
Crafty.c('c_wall_filler', {
    fill_in: function(start_x, start_y, x_lenght, y_lenght, fill_type){
        var stop_x = x_lenght + start_x;
        var stop_y = y_lenght + start_y;
        for (var i = start_x; i < stop_x; i++) {
            for (var y = start_y; y < stop_y; y++) {
                Game.occupied[i][y] = fill_type;
            }
        }
    },
});

//shows the text, that tells us which wave we are at. also how much time before next wave.
Crafty.c('c_wave_shower', {
    init: function() {
        this.requires('2D, DOM, Text');
        this.attr({ x: 650, y: 525, w: 100});
        this.text("Lives: 10");
        this.textColor("#FF0000");
        
        this.time = 0;
        this.wave_nr = 1;
        
        this.bind('EnterFrame', function(){
            if(this.time > 0){
            
                this.time--;
                this.text(function(){return "Time to next wave: " + Math.round(this.time/50)});
            }
            else{
                this.text(function(){return "Attack in progress! Defend the castle! Wave nr: " + this.wave_nr});
            }
        });
        
    },
    
    start_in: function(time_down, wave_nr){
        this.time = time_down;
        this.wave_nr = wave_nr+1;
    },
});

Crafty.c('c_gold_shower', {
    init: function() {
        this.requires('2D, DOM, Text');
        this.textColor("#FF0000");
        this.attr({ x: 550, y: 550, w: 100});
        this.last_value = Game.gold;
        this.text(function(){return "Gold: " + this.last_value});
        
        this.bind('EnterFrame', function(){
            if(this.last_value != Game.gold){
                this.last_value = Game.gold;
                this.text(function(){return "Gold: " + this.last_value});
            }
        });
        
    },

});

Crafty.c('c_error_message', {
    setup: function(message){
        this.requires('2D, DOM, Text');
        this.textColor("#FF0000");
        this.attr({ x: 400, y: 256, w: 100});
        this.bind('EnterFrame', this.frame);
        this.text(message);
        this.frame_count = 0;
        this.alive_in = 50*2;
    },
    
    frame: function(){
        this.frame_count++;
        if(this.frame_count > this.alive_in)
            this.destroy();
    },

});


Crafty.c('c_pathfinding', {
    find_path: function(from_x, from_y, to_x, to_y, path_array){
        var from_tile_x = Math.floor(from_x/Game.map_grid.tile.width);
        var from_tile_y = Math.floor(from_y/Game.map_grid.tile.height);
        
        var to_tile_x = Math.floor(to_x/Game.map_grid.tile.width);
        var to_tile_y = Math.floor(to_y/Game.map_grid.tile.height);
        
        var grid = new PF.Grid(Game.map_grid.width, Game.map_grid.height); 
        for (var i = 0; i < Game.map_grid.width; i++) {
            for (var y = 0; y < Game.map_grid.height; y++) {
                if(Game.occupied[i][y] == 1)
                    grid.setWalkableAt(i, y, 0);
                else
                    grid.setWalkableAt(i, y, 1);
            }
        }
        
        var finder = new PF.AStarFinder({allowDiagonal: true, dontCrossCorners: true});
        var path = finder.findPath(from_tile_x, from_tile_y, to_tile_x, to_tile_y, grid);
        //we copy the results over, at some point we should just use this kind of array instead
        //oh, and we also start from 1, because that's where we already is (otherwise it can result in weired turning around)
        for(var a = 1; a<path.length; a++){
            path_array.push(path[a][0]*Game.map_grid.tile.width+Game.map_grid.tile.width/2);
            path_array.push(path[a][1]*Game.map_grid.tile.height+Game.map_grid.tile.height/2);                
        }
  
    },
});


//floodfill alghorithm. Returns false if placing a tile on tile_x, tile_y will result in a enclosed walkable space
Crafty.c('c_floodfill', {
    do_flood_fill: function(tile_x, tile_y){
        //create an array that can get "filled"
        this.fill_array = new Array(Game.map_grid.width);
        for (var i = 0; i < Game.map_grid.width; i++) {
            this.fill_array[i] = new Array(Game.map_grid.height);
            for (var y = 0; y < Game.map_grid.height; y++) {
                this.fill_array[i][y] = 0;
            }
        }
        
        this.Stack = [];
        this.toFill = [];
        
        //toFil if there are tiles that didn't get filled! For that, we need to "emulate" that the current tile have already been filled in
        var temp = Game.occupied[tile_x][tile_y];
        Game.occupied[tile_x][tile_y] = 1;
        
        //fill the array, but not from the point of orgin, but from one of the tiles on the sides, because otherwise we will first know in the next floodfill if this tile will actually block the flood
        if(Game.occupied[tile_x-1][tile_y] == 0)
            this.floodFill(tile_x-1, tile_y);
        else if(Game.occupied[tile_x][tile_y-1] == 0)
            this.floodFill(tile_x, tile_y-1);
        else if(Game.occupied[tile_x+1][tile_y] == 0)
            this.floodFill(tile_x+1, tile_y);
        else if(Game.occupied[tile_x][tile_y+1] == 0)
            this.floodFill(tile_x, tile_y+1);
        
        var result = this.check_fill();
        //we change it back to as it was before
        Game.occupied[tile_x][tile_y] = temp;
        return result;
    },
    
    check_fill: function(){
        for (var i = 0; i < Game.map_grid.width; i++) {
            for (var y = 0; y < Game.map_grid.height; y++) {
                if(this.fill_array[i][y] == 0 && Game.occupied[i][y] != 1)
                    return false;//return [{x: i, y: y}];
            }
        }
        return true;
    
    },
    

    floodFill: function(x, y){
        this.fillPixel(x, y);
        while(this.Stack.length>0){
            this.toFill = this.Stack.pop();
            this.fillPixel(this.toFill[0], this.toFill[1]);
        }
    },

    fillPixel: function(x, y){
        if(!this.alreadyFilled(x, y)) this.fill(x, y);

        if(!this.alreadyFilled(x,   y-1)) this.Stack.push([x,   y-1]);
        if(!this.alreadyFilled(x+1, y  )) this.Stack.push([x+1, y  ]);
        if(!this.alreadyFilled(x,   y+1)) this.Stack.push([x,   y+1]);
        if(!this.alreadyFilled(x-1, y  )) this.Stack.push([x-1, y  ]);
    },

    fill: function(x, y){
	// this function will actually change the color of our box
    if(Game.occupied[x][y] != 1)
        this.fill_array[x][y] = 1;
    },

    alreadyFilled: function(x, y){
	// this functions checks to see if our square has been filled already
    if(this.fill_array[x][y] == 1 || Game.occupied[x][y] == 1)
        return true;
    else 
        return false;
    },
    
});
