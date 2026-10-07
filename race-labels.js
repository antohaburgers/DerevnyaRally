export class LabelLayout{
 constructor(){this.order=[];this.boxes=[];this.visible=[];this.since=new Float64Array(9);this.since.fill(-1);}
 reset(){this.since.fill(-1);this.visible.length=0;}
 update(candidates,now){const order=this.order,boxes=this.boxes,visible=this.visible;order.length=boxes.length=visible.length=0;for(const c of candidates){if(!c.valid||c.distance>60){this.since[c.id]=-1;continue;}let i=order.length;order.push(c);while(i>0&&order[i-1].distance>c.distance){order[i]=order[i-1];i--;}order[i]=c;}
 for(const c of order){const box=c.box;let overlap=false;for(const b of boxes)if(box.left<b.right+4&&box.right>b.left-4&&box.top<b.bottom+3&&box.bottom>b.top-3){overlap=true;break;}if(overlap||boxes.length===4){this.since[c.id]=-1;continue;}boxes.push(box);if(this.since[c.id]<0)this.since[c.id]=now;if(now-this.since[c.id]>=120)visible.push(c);}
 return visible;
 }
}
