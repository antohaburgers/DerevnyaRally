// Arcade touge counter. Chassis simulation is authoritative; this does not alter physics.
export class DriftScore{
 constructor(){this.reset();}
 reset(){this.points=0;this.combo=1;this.chain=0;this.grace=0;this.active=false;this.bestChain=0;}
 tick(dt,state,wheels){
  const speed=state.vehicleSpeed||0,angle=Math.abs(state.driftAngle||0),contact=wheels.filter(w=>!w.front&&w.contact).length;
  const drifting=state.driftCar&&speed>=23&&angle>=.15&&angle<1.18&&contact>0;
  if(drifting){
   this.active=true;this.grace=0;this.chain+=dt;
   this.combo=Math.min(5,1+Math.floor(this.chain/3));
   this.bestChain=Math.max(this.bestChain,this.chain);
   this.points+=dt*(speed/10)*(angle*180/Math.PI/10)*5*this.combo;
  }else{
   this.active=false;this.grace+=dt;
   if(this.grace>1.1){this.chain=0;this.combo=1;}
  }
 }
 get displayPoints(){return Math.floor(this.points);}
}
