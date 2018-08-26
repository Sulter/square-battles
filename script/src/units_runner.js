Crafty.c('c_Runner_unit', {
    init: function(){
        this.requires('c_Fighting_unit, spr_runner_enemy_unit');
        
        //the gold the player gets when this unit dies
        this.value = 5;
        
        //unit-defined, variables
        this.movement_speed = 1.75; 
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
        this.find_path(this.body.GetWorldCenter().x*30, this.body.GetWorldCenter().y*30, this.current_x_goal, this.current_y_goal, this.route_array);
        //bind the collision function
        this.onHit("Box2D", this.resolve_collision,  this.collision_damage); 
    },
    
    resolve_collision: function(data){
        if(data[0].fixA.GetUserData() == "body_fix" && data[0].fixB.GetUserData() == "body_fix"){
            if(data[0].obj.team == "enemy"){//we have a collision with a fellow enemy
                var angl = Math.atan2(data[0].obj.body.GetWorldCenter().y - this.body.GetWorldCenter().y, data[0].obj.body.GetWorldCenter().x - this.body.GetWorldCenter().x) + this.body.GetAngle();
                while ( angl < -Math.PI ) angl += 2*Math.PI;
                while ( angl >  Math.PI ) angl -= 2*Math.PI;
                //console.log('difference in angle was: ' + angl*(180/Math.PI));
                if(angl*(180/Math.PI) > -45 && angl*(180/Math.PI) < 45){
                    this.bump_back();
                }
            }
                
        } /*else if(data[0].fixA.GetUserData() == "body_fix" || data[0].fixB.GetUserData() == "body_fix"){
            if(data[0].fixA.GetUserData() != "sensor_cirkel" && data[0].fixB.GetUserData() != "sensor_cirkel"){
                if(data[0].fixA.GetUserData() != "Arrow" && data[0].fixB.GetUserData() != "Arrow"){
                    if(data[0].obj.team != "player"){
                        this.bump_back();
                    }
                }
            }
        
        }*/
    
    },
    
    bump_back: function(){
        var charge_energy =0.75;
        var x_f=Math.cos(this.body.GetAngle()-Math.PI)*charge_energy;
        var y_f=Math.sin(this.body.GetAngle()-Math.PI)*charge_energy;
            
        var impulse = new Box2D.Common.Math.b2Vec2(x_f,y_f);
        this.body.ApplyImpulse(impulse, this.body.GetWorldCenter());
        
        this.path_recalculation();
    },


});