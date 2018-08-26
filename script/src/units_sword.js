Crafty.c('c_Sword_unit', {
    init: function(){
        this.requires('c_Fighting_unit, spr_sword_unit');
        
        //unit-defined, variables
        this.movement_speed = 1.25;   
        this.turning_speed = 15;
        
        //make the object clickable and adds the area map
        this.bind('Click', this.selected_unit);
        this.areaMap([0,0],[0,this.h],[this.w,this.h],[this.w,0]);
        //untoggling unit function, that is called when somebody clicks beside a unit
        this.bind('untoggle_unit', function(){if(this.unit_selcted){ this.unit_selcted = false; if(this.team == "player"){this.toggleComponent("spr_sword_unit","spr_sword_unit_highlight");}else{this.toggleComponent("spr_sword_enemy_unit","spr_sword_enemy_unit_highlight");}}});
        
        this.charge_attack_cd = 10;
        this.frames_since_last_charge = 0;
        this.just_charged = false;
        
        //runs each frame
        this.bind('EnterFrame', function(){
            this.unit_change_goal(); 
            if(!this.just_charged){
                if(this.check_engage())
                    this.charge_enemy();  
            }else{
                this.frames_since_last_charge++;
                if(this.frames_since_last_charge > this.charge_attack_cd){
                    this.frames_since_last_charge = 0;
                    this.just_charged = false;
                }
            }
            
        });
  
    },
    
    charge_enemy : function(){
        this.route_array.splice(0, this.route_array.length);
        this.route_array.push(this.opponent_ref.x); //follow him!
        this.route_array.push(this.opponent_ref.y); 
        //if we are close enough and cd is down - CHARGE HIM
        if( 0.75 > Crafty.math.distance(this.body.GetWorldCenter().x, this.body.GetWorldCenter().y, this.opponent_ref.body.GetWorldCenter().x, this.opponent_ref.body.GetWorldCenter().y)){
            var charge_energy = 3;
            var x_f=Math.cos(this.body.GetAngle())*charge_energy;
            var y_f=Math.sin(this.body.GetAngle())*charge_energy;
            
            var impulse = new Box2D.Common.Math.b2Vec2(x_f,y_f);
            this.body.ApplyImpulse(impulse, this.body.GetWorldCenter());
            
            this.just_charged = true;
            this.route_array.splice(0, this.route_array.length);
            
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
                this.toggleComponent("spr_sword_unit","spr_sword_unit_highlight"); 
                
            }
            else{
                this.toggleComponent("spr_sword_enemy_unit","spr_sword_enemy_unit_highlight");
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
            this.toggleComponent("spr_sword_unit","spr_sword_unit_highlight"); 
                
        }
        else{
            this.toggleComponent("spr_sword_enemy_unit","spr_sword_enemy_unit_highlight");
        }
    
    },
    
    setup: function(x, y, his_team){
        this.unit_setup(x, y, his_team);
        
        //bind the collision function
        this.onHit("Box2D", this.start_collision_unit,  this.collision_damage);

        //change sprite, depending if enemy or foe sword unit
        if(this.team == "enemy")
            this.toggleComponent("spr_sword_unit","spr_sword_enemy_unit");
 
    }    

});