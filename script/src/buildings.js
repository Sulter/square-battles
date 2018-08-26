//shooter
Crafty.c('c_Shooter', {
    init: function() {
        this.requires('Box2D, Canvas, c_wall_filler, spr_shooter, c_context_menu');

        var shooting_cd = 50*8;
        var tick_counter = 0;
        //value, used for calculating the money you get back when sold
        this.value = 25;
        //remove the value
        Game.gold -= this.value;
    
        this.bind('EnterFrame', function(){
            tick_counter++;
            if(tick_counter > shooting_cd){
                tick_counter = 0;
                //we shoot the arrows, but only if no adjacent tile already there
                var tile_x = this.x/Game.map_grid.tile.width;
                var tile_y = this.y/Game.map_grid.tile.height;
                //up
                if(Game.occupied[tile_x][tile_y-1] != 1)
                    Crafty.e('c_Arrow').setup(this.x+Game.map_grid.tile.width/2, this.y-2, Math.PI+Math.PI/2);  
                //right
                if(Game.occupied[tile_x+1][tile_y] != 1)
                    Crafty.e('c_Arrow').setup(this.x+Game.map_grid.tile.width+2, this.y+Game.map_grid.tile.height/2, 0);
                //down
                if(Game.occupied[tile_x][tile_y+1] != 1)
                    Crafty.e('c_Arrow').setup(this.x+Game.map_grid.tile.width/2, this.y+Game.map_grid.tile.height+2, Math.PI/2);
                //left
                if(Game.occupied[tile_x-1][tile_y] != 1)
                    Crafty.e('c_Arrow').setup(this.x-2, this.y+Game.map_grid.tile.height/2, Math.PI);
            }

        });
        
    },  
  
    setup: function(x, y){
        this.attr({ x: x, y: y, w: Game.map_grid.tile.width, h:Game.map_grid.tile.height, type: "static"});
        //for the menu (must have for all buildings!)
        this.menu_x = this.x+this.w/2;
        this.menu_y = this.y+this.h/2;
        this.menu_w = Game.map_grid.tile.width;
        this.menu_h = Game.map_grid.tile.height;
        
        //name the fixture "building_fix"
        var body_fixture = new Box2D.Dynamics.b2Fixture;
        body_fixture = this.body.GetFixtureList();
        body_fixture.SetUserData('building_fix'); 
    },
    //a must have for all buildings - frees up the space it takes up
    free_up: function(){
        Game.occupied[this.x/Game.map_grid.tile.width][this.y/Game.map_grid.tile.height] = 0;
    },
    
    remove_me: function(){
        this.free_up();
        Crafty.trigger('recalc_path');
        if(this.toggled){
            this.bg_ref.destroy(); 
            this.sell_ref.destroy();
        }
        //destroys itself
        this.destroy();  
    },
});

//rotator:
Crafty.c('c_Rotator', {
    init: function() {
        this.requires('Box2D, Canvas, Color, c_wall_filler, c_context_menu');
        this.color("blue");
        //value, used for calculating the money you get back when sold
        this.value = 10;
        //remove the value
        Game.gold -= this.value;        
        
        //rotator, because of its shape, needs a special areaMap for clicking
        this.areaMap([-28,-28],[28,-28],[28,28],[-28,28]);
        //different variables, because of rotation
        var rotation_duration = 50*2;
        var not_rotation_duration = 50*3;
        var rotating = true;
        var tick_counter = 0;
    
        this.body_fixture = new Object();
    
        this.bind('EnterFrame', function(){
            tick_counter++;
            if(rotating){
                this.body.SetAngularVelocity(10);
                if(tick_counter > rotation_duration){
                    rotating = false;
                    //disable body collisions
                    this.body_fixture.SetSensor(true);
                    tick_counter = 0;
                }
            } else{
                this.body.SetAngularVelocity(0.5);
                if(tick_counter > not_rotation_duration){
                    rotating = true;
                    //enable body collisions
                    this.body_fixture.SetSensor(false);
                    tick_counter = 0;
                }
            }
        });
        
    },  
  
    setup: function(x, y){
        this.attr({ x: x, y: y, w: 22, h:2, type: "kinematic"});
        //make sure that the tiles get "occupied" (but not blocking for path finding)
        this.tile_x = Math.floor(x/Game.map_grid.tile.width);
        this.tile_y = Math.floor(y/Game.map_grid.tile.height);
    
        //name the rotators fixture "rotator"
        this.body_fixture = new Box2D.Dynamics.b2Fixture;
        this.body_fixture = this.body.GetFixtureList();
        this.body_fixture.SetUserData('rotator');
    
        //for the menu (must have for all buildings!)
        this.menu_x = this.x;
        this.menu_y = this.y;
        this.menu_w = Game.map_grid.tile.width;
        this.menu_h = Game.map_grid.tile.height;
    
        //make sure the tiles around it gets occupied
        this.fill_in(this.tile_x-1, this.tile_y-1, 3,3,2);
        Game.occupied[this.tile_x][this.tile_y] = 1; //the center shouldn't be walkable
        
        //name the fixture "building_fix"
        var body_fixture = new Box2D.Dynamics.b2Fixture;
        body_fixture = this.body.GetFixtureList();
        body_fixture.SetUserData('building_fix'); 
    },
    //a must have for all buildings - frees up the space it takes up
    free_up: function(){
        this.fill_in(this.tile_x-1, this.tile_y-1, 3,3,0);
    },
    
    remove_me: function(){
        this.free_up();
        Crafty.trigger('recalc_path');
        if(this.toggled){
            this.bg_ref.destroy(); 
            this.sell_ref.destroy();
        }
        //destroys itself
        this.destroy();  
    },
});

//wall
Crafty.c('c_Wall', {
    init: function() {
        this.requires('Box2D, Canvas, spr_wall, c_context_menu');
        
        //value, used for calculating the money you get back when sold
        this.value = 5;
        //remove the value
        Game.gold -= this.value;        
    },
    
    setup: function(x,y){
        this.attr({x:x, y:y, w:Game.map_grid.tile.width, h:Game.map_grid.tile.height, type: "static",  friction: 0});
        //make this spot occupied!
        Game.occupied[x/Game.map_grid.tile.width][y/Game.map_grid.tile.height] = 1;
        
        //for the menu (must have for all buildings!)
        this.menu_x = this.x+this.w/2;
        this.menu_y = this.y+this.h/2;
        this.menu_w = Game.map_grid.tile.width;
        this.menu_h = Game.map_grid.tile.height;
        
        //name the fixture "building_fix"
        var body_fixture = new Box2D.Dynamics.b2Fixture;
        body_fixture = this.body.GetFixtureList();
        body_fixture.SetUserData('building_fix'); 
    }, 
    
    //a must have for all buildings - frees up the space it takes up
    free_up: function(){
        Game.occupied[this.x/Game.map_grid.tile.width][this.y/Game.map_grid.tile.height] = 0;
    },
    
    remove_me: function(){
        this.free_up();
        Crafty.trigger('recalc_path');
        if(this.toggled){
            this.bg_ref.destroy(); 
            this.sell_ref.destroy();
        }
        //destroys itself
        this.destroy();  
    },
});

//context menu, this shows the whole "menu wheel" when a building is clicked, and all the options. also have the callbacks for pressing all the options etc.
Crafty.c('c_context_menu', {
    init: function() {
        this.requires('Mouse');
        
        //referances to differenet menu parts
        this.toggled = false; //not currently in use
        this.bg_ref;
        this.sell_ref;
        
        //bring up the context menu on mouse click, also disable anything else that is "toggled" (units etc.), but only if left click.
        this.bind('MouseDown', function(e) {if(e.button == 0 && this.toggled == false){this.toggled=true; Crafty.trigger('untoggle_unit'); this.init_contect_menu();}})
    },
    
    //destroys the building, destroys the menu, makes a free room where it was before (remember to have a building specifc function for that) should give some % of the build cost? also makes all units recalc path
    sell_it: function(){
        Game.gold += Math.round(this.value*0.75);
        //destroys menu, and the building, should also do some $$$ stuff
        this.remove_me();
    },
    
    init_contect_menu: function(){
        //make the "toogle background black circle"
        this.bg_ref = Crafty.e('c_context_bg');
        this.bg_ref.at(this.menu_x,this.menu_y);
        
        this.sell_ref = Crafty.e('c_context_sell');
        this.sell_ref.setup(this.menu_x,this.menu_y, this);
        
        //this binds the function that will make all the contxt menu dissaper if the user presses somewhere outside anything clickable, or choose another building
        this.bind('untoggle_unit', function(){this.toggled=false; this.bg_ref.destroy(); this.sell_ref.destroy(); this.unbind('untoggle_unit');});
    },

});

//context menu background
Crafty.c('c_context_bg', {
    init: function() {
        this.requires('2D, Canvas, spr_context_bg');
    },
    at: function(x,y){
        this.attr({x:x-30, y:y-30});
    },
});

//context menu sell building
Crafty.c('c_context_sell', {
    init: function() {
        this.requires('2D, Canvas, spr_context_sell, Mouse');
        this.building_ref;
        
    },
    setup: function(x,y, ref){
        this.attr({x:x-23, y:y-23, w:10, h:19});
        this.building_ref = ref;
        this.bind('MouseDown', function() {this.building_ref.sell_it();});
    },
});