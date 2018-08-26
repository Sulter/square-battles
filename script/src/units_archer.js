Crafty.c('c_Archer_unit', {
    init: function(){      
        this.requires('c_Fighting_unit, spr_archer_unit');
        
        //unit-defined, variables
        this.movement_speed = 1.25;
        this.turning_speed = 15;        
        
        //make the object clickable and adds the area map
        this.bind('Click', this.selected_unit);
        this.areaMap([0,0],[0,this.h],[this.w,this.h],[this.w,0]);
        
        //untoggling unit function, that is called when somebody clicks beside a unit
        this.bind('untoggle_unit', function(){if(this.unit_selcted){ this.unit_selcted = false; if(this.team == "player"){this.toggleComponent("spr_archer_unit","spr_archer_unit_highlight");}else{this.toggleComponent("spr_archer_enemy_unit","spr_archer_enemy_unit_highlight");}}});
        
        //the archers firing speed
        this.shooting_speed = 50*3;
        this.time_since_last_shot =0;
        
        //runs each frame
        this.bind('EnterFrame', function(){
            this.unit_change_goal();  
            if(this.check_engage())
                this.fire_arrow();
                
        });
        
        
    
    },
    
    fire_arrow: function(){
        //keep track of the shooting timing
        this.time_since_last_shot++;
        
        //first we rotate to face the enemy
        var delta_x = (this.body.GetWorldCenter().x*30) - (this.opponent_ref.body.GetWorldCenter().x*30);
        var delta_y = (this.body.GetWorldCenter().y*30) - (this.opponent_ref.body.GetWorldCenter().y*30);
        var direction_angle_rad = Math.atan2(delta_y,delta_x) + Math.PI; 
        
        this.rotate_towards_angle(direction_angle_rad);
            
        if(this.time_since_last_shot > this.shooting_speed){  //if it's time to shoot, we shoot another arrow      
              
            //first we need to transform (aka. find the coords where the arrow should spawn)
            var px = (this.body.GetWorldCenter().x*30)+(this.w/2)+5;
            var py = (this.body.GetWorldCenter().y*30);
            var cx = (this.body.GetWorldCenter().x*30);
            var cy = (this.body.GetWorldCenter().y*30);
            var angle = this.body.GetAngle();
            
            var s = Math.sin(angle);
            var c = Math.cos(angle);

            px -= cx;
            py -= cy;

            var xnew = px * c - py * s;
            var ynew = px * s + py * c;

            // translate point back:
            px = xnew + cx;
            py = ynew + cy;
            
            //console.log('mid is at x: ' + (this.body.GetWorldCenter().x*30) + 'y: ' + (this.body.GetWorldCenter().y*30) + 'we shot from x: ' + px + 'y: ' + py);
            Crafty.e('c_Arrow').setup(px, py, direction_angle_rad);
            this.time_since_last_shot=0;
            
            
        }
    
    },
    
    selected_unit: function(data){
        if(data.button == 0){//we left clicked on the box
            if(!this.isDown('CTRL')){
                Crafty.trigger('untoggle_unit');
            }
            
            this.unit_selcted = !this.unit_selcted;
            
            if(this.unit_selcted){//at which time was the unit highlighted?
                var d = new Date();
                this.toggle_time = d.getTime();
            }
        
            if(this.team == "player"){   //toggle between "highlighted", for both the enemy and friend
                this.toggleComponent("spr_archer_unit","spr_archer_unit_highlight"); 
                
            }
            else{
                this.toggleComponent("spr_archer_enemy_unit","spr_archer_enemy_unit_highlight");
            }
    
        }
    },
    
    drag_selected: function(){
        this.unit_selcted = !this.unit_selcted;
            
        if(this.unit_selcted){//at which time was the unit highlighted?
            var d = new Date();
            this.toggle_time = d.getTime();
        }
        
        if(this.team == "player"){   //toggle between "highlighted", for both the enemy and friend
            this.toggleComponent("spr_archer_unit","spr_archer_unit_highlight"); 
                
        }
        else{
            this.toggleComponent("spr_archer_enemy_unit","spr_archer_enemy_unit_highlight");
        }
    
    },
    
    setup: function(x, y, his_team){
        this.unit_setup(x, y, his_team);
        
        //bind the collision function
        this.onHit("Box2D", this.start_collision_unit, this.collision_damage);
        
        //change sprite, depending if enemy or foe sword unit
        if(this.team == "enemy")
            this.toggleComponent("spr_archer_unit","spr_archer_enemy_unit");
    
    }  
    

});