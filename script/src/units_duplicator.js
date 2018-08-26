Crafty.c('c_Duplicator_unit', {
    init: function(){
        this.requires('c_Fighting_unit, spr_duplicator_enemy_unit');
        
        //the gold the player gets when this unit dies
        this.value = 10;
        
        //unit-defined, variables
        this.movement_speed = 1.25; 
        this.turning_speed = 21; //this should propably match movement speed in % with all units? Otherwise turning corners etc. can get very hard or impossible
        
        //are map is currently needed for the isAt function
        this.areaMap([0,0],[0,this.h],[this.w,this.h],[this.w,0]); 
		//but we won't need the mouse anymore, so we can remove it		
		this.removeComponent("Mouse", false); 
        this.bind('EnterFrame', this.duplicate);
        this.frame_counter =0;
        this.spaw_after = Math.floor((Math.random()*30)+10);
        this.spawn = 0;
        this.spawn_x;
        this.spawn_y;
    },
    
    duplicate: function(){
        this.frame_counter++;
        if(this.spawn > 0){
            this.spawn++;
            if(this.spawn > 6){
                Crafty.e('c_Duplicator_unit').setup(this.spawn_x, this.spawn_y, "enemy");
                this.spawn = 0;
            }
        }
        if(this.frame_counter > this.spaw_after*50){
            this.spawn_x = Math.round(this.body.GetWorldCenter().x*30-this.w/2);
            this.spawn_y = Math.round(this.body.GetWorldCenter().y*30-this.h/2);
            this.frame_counter = 0;
            this.spaw_after = Math.floor((Math.random()*30)+5);
            this.spawn++;
        }
    
    },
    
    can_place: function(){
        //make the query, to find out if there is enough room to place the new unit
        var aabb = new Box2D.Collision.b2AABB;
        var low = new Box2D.Common.Math.b2Vec2;
        var high = new Box2D.Common.Math.b2Vec2;
        low.Set(this.spawn_x, this.spawn_y);
        high.Set(this.spawn_x+10, this.spawn_x+10);
        aabb.lowerBound = low;
        aabb.upperBound = high;
        var counter = 0;
        Crafty.Box2D.world.QueryAABB(function(fix){
            if(fix.GetUserData() == "body_fix" ){
                counter++;
            } else if(fix.GetUserData() == "building_fix" ){
                counter+=10;
            }    
            return true;
        }, aabb);
        
        if(counter < 2)
            return true;
        
        return false;
    
    },
    
    setup: function(x, y, his_team){
        this.unit_setup(x, y, his_team);
		
		//give him the path to the base
		this.current_x_goal = 105;
        this.current_y_goal = 440;
        this.find_path(this.body.GetWorldCenter().x*30, this.body.GetWorldCenter().y*30, this.current_x_goal, this.current_y_goal, this.route_array);
        //bind the collision function
        this.onHit("Box2D", function(){},  this.collision_damage); 
    },
});