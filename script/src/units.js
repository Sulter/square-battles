Crafty.c('c_Fighting_unit', {
    init: function() {
        this.requires('Box2D, Canvas, Mouse, c_pathfinding, Keyboard')
        .z=10
        
        //different hp variables
        this.is_dead = false; //because we need to wait for the next frame before destroying when hp is 0
        this.max_hp = 100;
        this.current_hp = 50;
        this.hp_bar_ref = new Object();
        
        this.unit_selcted = false;//if selected - next click will give movement command
        
        //goal x and y from the click
        this.current_x_goal = 0;
        this.current_y_goal = 0;
        this.toggle_time = 0; //utc time, at which the unit was toggled
        
        //for engaging an opponent
        this.is_engaging = false;
        this.opponent_ref = new Object();
        this.sensor_enemy_array = new Array();//array holding the units the sensor have collide with
        
        //array telling this unit where to move, the forma is x,y,x,y,x,y,x,y in tiles coords (for now). on_path just tells us if we already calculated the angle to the new waypoint
        this.route_array=new Array();
        
        //collisions flag, so we don't follow our path while colliding
        this.is_colliding = false;
		
		//binds the global trigger function for recalculating path, when new tiles are placed
		this.bind('recalc_path', this.path_recalculation);
        
         //each frame
        this.bind('EnterFrame', function(){
	    this.unit_follow_path();//we make the unit follow the given path (if any)
            this.hp_bar_ref.update_bar_position(this.body.GetWorldCenter().x*30, this.body.GetWorldCenter().y*30); //we update the position of the health bar
            if(this.is_dead){
                this.hp_bar_ref.destroy();
                if(this.team == 'enemy'){
                    Game.enemy_alive--;
                    Game.gold += this.value;
                }
                this.destroy(); 
            }
            
            if(this.current_hp <= 0){
                this.is_dead = true;
            }
            
            this.is_colliding=false; 
            this.z=0;
        });
   
    },
    
    collision_damage: function(data){
        if(data[0].fixA.GetUserData() == "Arrow" || data[0].fixB.GetUserData() == "Arrow"){//hit by arrow, arrow take care of the welding of joints, so lets take care of damage on this side
            var damage_done = data[0].impulse.normalImpulses[0]*10;
            if(damage_done > 5){
                this.current_hp -= damage_done;
                this.hp_bar_ref.update_bar_size(this.current_hp/this.max_hp);
            }
        } else if(data[0].fixA.GetUserData() == "body_fix" && data[0].fixB.GetUserData() == "body_fix"){//two bodys collided
            if(this.team != "player" && data[0].obj.team == "player"){ //two bodys from two different teams, let's calculate the damage here
                var damage_done = data[0].impulse.normalImpulses[0]*10;
                if(damage_done > 5){
                    this.current_hp -= damage_done;
                    this.hp_bar_ref.update_bar_size(this.current_hp/this.max_hp);
                }
            }
        } 
        if(data[0].fixA.GetUserData() == "body_fix" || data[0].fixB.GetUserData() == "body_fix"){//Crafty(data[0].fixA.GetBody().GetUserData
            if(data[0].fixA.GetUserData() == "rotator" || data[0].fixB.GetUserData() == "rotator"){
                var damage_done = data[0].impulse.normalImpulses[0];
                if(damage_done > 5){
                    this.current_hp -= damage_done;
                    this.hp_bar_ref.update_bar_size(this.current_hp/this.max_hp);
                }          
            }        
        }
        
    },
    //function only used by units that can "engage" other units
    start_collision_unit: function(data){
        if(data[0].fixA.GetUserData() == "sensor_cirkel" || data[0].fixB.GetUserData() == "sensor_cirkel"){//one of the collidie's are a sensor circle
    
            if(data[0].fixA.GetUserData() == "body_fix" || data[0].fixB.GetUserData() == "body_fix"){//one of the others are actually a body (unit)
                if(data[0].obj.team != this.team){//we check if the circle is colliding with someone from not our team
                    //this.opponent_ref = data[0].obj;
                    //this.is_engaging = true;  
                    //first we check if the object is not already in the array
                    var duplicat = false;
                    for(var a=0; a<this.sensor_enemy_array.length; a++){
                        if(this.sensor_enemy_array[a][0] == data[0].obj[0])
                            duplicat = true;
                    }
                    if(!duplicat){
                        this.sensor_enemy_array.push(data[0].obj);
                    }
                        
                }
            }
        }/*else if(data[0].obj.team != this.team){ //collision with something that isn't your team m8
            //make sure that not only opposite teams, but also actually bodys (units) colliding
            if(data[0].fixA.GetUserData() == "body_fix" && data[0].fixB.GetUserData() == "body_fix")//two bodys touches - destroy them
                this.current_hp = -10;
        }        
        else { //collision with someone from same team (or something else then the other things, at least borders etc.)
            var push_away_force = 0.4;
            //this.is_colliding=true;
            //var impulse = new Box2D.Common.Math.b2Vec2(Math.cos(this.body.GetAngle()-Math.PI-Math.random())*push_away_force,Math.sin(this.body.GetAngle()-Math.PI-Math.random())*push_away_force);
            //this.body.ApplyImpulse(impulse, this.body.GetWorldCenter());
            //console.log('collision with own team');
        }*/
              
    },

    
    check_engage: function(){
        //if it's engaging an enemy
        if(this.is_engaging){
            //check if the object still exsists (aka. the enemy isn't ded) *AND* check if the enemy is still in the field of view too, otherwise stop prosue
            if(!this.opponent_ref.is_dead && this.check_visibility(this.opponent_ref)){
                    return true;
            }else{
                //since the enemy is ded - stop engagin, and delete the current coords, because why would we need those?
                this.is_engaging = false;
                this.route_array.splice(0,2);  
            }
        }else if(this.route_array.length == 0){ //only if we are not en route
            //since we are not engagin, go trough the list, and check which enemy is closest
            var closest_distance = 9999999999;
            var array_number;
            for(var a=0; a<this.sensor_enemy_array.length; a++){
                //first we check whatever this object should actually be removed because it is ded (watch out for bug!)
                if(!this.sensor_enemy_array[a].is_dead && this.sensor_enemy_array[a].body != null){
                    
                    //we find the one that is the cloest
                    var current_distance = Crafty.math.distance(this.body.GetWorldCenter().x, this.body.GetWorldCenter().y, this.sensor_enemy_array[a].body.GetWorldCenter().x, this.sensor_enemy_array[a].body.GetWorldCenter().y);
                    if(current_distance < closest_distance){
                        //okay we now have one that is closer then the previous one, but let's make sure that our raycast will result in its body being first
                        if(this.check_visibility(this.sensor_enemy_array[a])){
                            closest_distance = current_distance;
                            array_number = a;
                        }
                    }
                
                }
                else{//remove the null element
                    this.sensor_enemy_array.splice(a,1);
                }
                    
            }
            //we make sure that we actually found one (that the array wasn't empty or full of dead units)
            if(array_number != null){
                this.is_engaging = true;
                this.opponent_ref = this.sensor_enemy_array[array_number];
            }
        }
        
        return false;    
    
    },
    
    check_visibility: function(object_to_test){
        var point_1 = new Box2D.Common.Math.b2Vec2;
        point_1.Set(this.body.GetWorldCenter().x, this.body.GetWorldCenter().y);
        var point_2 = new Box2D.Common.Math.b2Vec2;
        point_2.Set(object_to_test.body.GetWorldCenter().x, object_to_test.body.GetWorldCenter().y);
        var smallest_fix = new Object();
        var smallest_frac = 99999999999;
        Crafty.Box2D.world.RayCast(function(fix, point, norm, frac){
            //the callback function
            if(frac < smallest_frac && fix.GetUserData() != "sensor_cirkel" && fix.GetUserData() != "Arrow"){ //see if the frac (distance) is smaller then the previous one, but also make sure that we are not looking at a sensor arrow!!
                smallest_frac = frac;
                smallest_fix = fix;                            
            }
                        
        }, point_1, point_2);  
        if(smallest_fix.GetBody().GetUserData() == object_to_test.body.GetUserData())//so only if the ID of the bodys are the same, otherwise the ray actually hit something else first
            return true;
        
        return false;
    
    },
    
    unit_setup: function(x, y, his_team) {
        //most of the set up is done here, because box2d creates the object AFTER attr() is run
        this.attr({ x: x, y: y, r: 6, type: "dynamic", team: his_team, friction: 0, z:10});  

        //add the "HP BAR"
        this.hp_bar_ref = Crafty.e('c_hp_bar');
        this.hp_bar_ref.setup(this.x, this.y);
        
        //setting physical attributes
        this.body.SetAngularDamping(10);
        this.body.SetLinearDamping(10);
        
        //name the "body" fixture "body fix"
        var body_fixture = new Box2D.Dynamics.b2Fixture;
        body_fixture = this.body.GetFixtureList();
        body_fixture.SetUserData('body_fix'); 
        
        //make a collision sensor fixture for this unit, but only if not enemy.
        if(this.team != "enemy"){
            var circle_sensor = new Box2D.Collision.Shapes.b2CircleShape
            circle_sensor.m_p.Set(8/30, 8/30); //position, relative to body position
            circle_sensor.m_radius = 6; //radius
            var sensor_fixture = new Box2D.Dynamics.b2FixtureDef;
            sensor_fixture.shape = circle_sensor; //make the fixture a circle
            sensor_fixture.isSensor = true;//make it a sensor
            sensor_fixture.userData = 'sensor_cirkel';
        
            //the sensor will not collide with other sensors     
            sensor_fixture.filter.categoryBits = 0x1000;
            sensor_fixture.filter.maskBits = 0x0FFF;
            
            this.body.CreateFixture(sensor_fixture); //add the fixture to the body
        }
        
        
    },
    
    rotate_towards_angle: function(direction_angle_rad){
	//math so hard etc.:
        var nextAngle =  this.body.GetAngle() + this.body.GetAngularVelocity() / this.turning_speed;
        var totalRotation = direction_angle_rad - nextAngle;
        while ( totalRotation < -Math.PI ) totalRotation += 2*Math.PI;
        while ( totalRotation >  Math.PI ) totalRotation -= 2*Math.PI;
        var desiredAngularVelocity = totalRotation * this.turning_speed;
        var torque = this.body.GetInertia() * desiredAngularVelocity / (1/this.turning_speed);
        this.body.ApplyTorque( torque );
        
    },
    
    unit_follow_path: function() {
        //check if we have any path
        if(this.route_array.length != 0 && !this.is_colliding){

            var delta_x = (this.body.GetWorldCenter().x*30) - this.route_array[0];
            var delta_y = (this.body.GetWorldCenter().y*30) - this.route_array[1];
                
            var direction_angle_rad = Math.atan2(delta_y,delta_x) + Math.PI; 
           
            //we rotate towards the target            
            this.rotate_towards_angle(direction_angle_rad);
            
            //we move in the direction
            
            var vel = this.body.GetLinearVelocity();
            
            var x_f=Math.cos(this.body.GetAngle())*this.movement_speed;
            var y_f=Math.sin(this.body.GetAngle())*this.movement_speed;
            
            var vel_change_x = x_f - vel.x; 
            var vel_change_y = y_f - vel.y;
            
            var imp_x = this.body.GetMass() * vel_change_x;
            var imp_y = this.body.GetMass() * vel_change_y;
            
            var impulse = new Box2D.Common.Math.b2Vec2(imp_x,imp_y);
            this.body.ApplyImpulse(impulse, this.body.GetWorldCenter());
            
            //we check if we have arrived at the point - if we have, remove the coord from the path
            if(this.isAt(this.route_array[0], this.route_array[1])){
                this.route_array.splice(0,2);  
            }
        }
    
    },
    
     unit_change_goal: function(){
        //if the unit is mouse-selected, the next click should set it's goal to that coord. As long as the last click didn't toggle an  other unit!
        if(this.unit_selcted ){
            var dat = new Object();
            Crafty.trigger('get_x_and_y', dat);
            //console.log(dat);
            if(this.current_x_goal != dat.x && this.current_y_goal != dat.y && this.toggle_time < dat.last_time){
                //find a new A* path (we should first simply cast a ray though)
                this.route_array.splice(0, this.route_array.length);//delete old path           
                this.current_x_goal = dat.x;
                this.current_y_goal = dat.y;
                
                this.find_path(this.body.GetWorldCenter().x*30, this.body.GetWorldCenter().y*30, dat.x, dat.y, this.route_array);
                //should stop following the enemy, because we gave it a new coord
                this.is_engaging = false;
            }
        }    
    },
	
	path_recalculation: function(){
		this.route_array.splice(0, this.route_array.length);//delete old path   
		//find new path, but to the same goal
		this.find_path(this.body.GetWorldCenter().x*30, this.body.GetWorldCenter().y*30, this.current_x_goal, this.current_y_goal, this.route_array);
	},
	
	
    
});
