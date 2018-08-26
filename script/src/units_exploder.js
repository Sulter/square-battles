Crafty.c('c_Exploder_unit', {
    init: function(){
        this.requires('c_Fighting_unit, spr_exploder_enemy_unit');
        
        //the gold the player gets when this unit dies
        this.value = 5;
        
        //unit-defined, variables
        this.movement_speed = 0.75; 
        this.turning_speed = 21; //this should propably match movement speed in % with all units? Otherwise turning corners etc. can get very hard or impossible
        
        //are map is currently needed for the isAt function
        this.areaMap([0,0],[0,this.h],[this.w,this.h],[this.w,0]); 
		//but we won't need the mouse anymore, so we can remove it		
		this.removeComponent("Mouse", false); 
    },
    
    setup: function(x, y, his_team){
        this.unit_setup(x, y, his_team);
		
		//give him the path to the base
		this.current_x_goal = 105;
        this.current_y_goal = 440;
        //just add this to the array, this will result in simply walking towards the base
        this.route_array.push(this.current_x_goal);
        this.route_array.push(this.current_y_goal);
        //bind the collision function
        this.onHit("Box2D", this.resolve_collision); 
        //remove the recalc path, because no matter what, this unit will just charge for the base
        this.unbind('recalc_path');
    },
    
    resolve_collision: function(data){
        if(data[0].fixA.GetUserData() != "sensor_cirkel" && data[0].fixB.GetUserData() != "sensor_cirkel"){//we just want to make sure that it wasn't a sensor
            this.explode();
        }    
    },
    
    explode: function(){
        //kill itself
        this.current_hp =0 ;
        //create the explosion animation
        var a = Crafty.e('c_Explosion');
        a.setup(this.x-this.w/2, this.y-this.h/2);
        //query all fixtures in area, figure out what they are, first apply force to them in a bigger area, then destroy all those that are close
        var aabb = new Box2D.Collision.b2AABB;
        var low = new Box2D.Common.Math.b2Vec2;
        var high = new Box2D.Common.Math.b2Vec2;
         //make the query, for entities that needs to be pushed away (no damage?)
        low.Set(this.body.GetWorldCenter().x-3, this.body.GetWorldCenter().y-3);
        high.Set(this.body.GetWorldCenter().x+3, this.body.GetWorldCenter().y+3);
        aabb.lowerBound = low;
        aabb.upperBound = high;
        var center_x = this.body.GetWorldCenter().x;
        var center_y = this.body.GetWorldCenter().y;
        
        Crafty.Box2D.world.QueryAABB(function(fix){
            
            if(fix.GetUserData() != "sensor_cirkel" && fix.GetUserData() != 'undefined' ){
                //find the angle:
                var delta_x = center_x - fix.GetBody().GetWorldCenter().x;
                var delta_y = center_y - fix.GetBody().GetWorldCenter().y;         
                var direction_angle_rad = Math.atan2(delta_y,delta_x) + Math.PI; 
                
                //apply impulse
                var explosion_force = 2;
                var x_f=Math.cos(direction_angle_rad)*explosion_force;
                var y_f=Math.sin(direction_angle_rad)*explosion_force;
                var impulse = new Box2D.Common.Math.b2Vec2(x_f,y_f);
                fix.GetBody().ApplyImpulse(impulse, fix.GetBody().GetWorldCenter());
                
            }
          
            return true;
        }, aabb);
        
        
        //make the query, for objects that needs to be destroyed completely
        low.Set(this.body.GetWorldCenter().x-0.5, this.body.GetWorldCenter().y-0.5);
        high.Set(this.body.GetWorldCenter().x+0.5, this.body.GetWorldCenter().y+0.5);
        aabb.lowerBound = low;
        aabb.upperBound = high;
        
        Crafty.Box2D.world.QueryAABB(function(fix){
            if(fix.GetUserData() == "building_fix" ){
                if(Crafty(fix.GetBody().GetUserData()) != 'undefined' && Crafty(fix.GetBody().GetUserData()).length > 0){
                    //console.log(Crafty(fix.GetBody().GetUserData()));
                    Crafty(fix.GetBody().GetUserData()).remove_me();
                }
                
            }else if(fix.GetUserData() == "body_fix" ){
                if(Crafty(fix.GetBody().GetUserData()) != 'undefined')
                    Crafty(fix.GetBody().GetUserData()).current_hp = 0;
            }            
            return true;
        }, aabb);

    }
});

Crafty.c('c_Explosion', {    
    setup: function(x, y){
        this.requires('2D, Canvas, spr_teleporter, spr_explosion, SpriteAnimation');
        this.attr({x:x-this.w/2, y:y-this.h/2});
        this.animate('animation', 0, 0, 16);
        this.animate('animation', 48, 0);
        this.bind('EnterFrame', function(){
        if(!this.isPlaying('animation'))
            this.destroy();
        });
    },

});