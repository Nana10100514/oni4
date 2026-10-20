'use strict';
// Heights relative to one oni, estimated from zentai.png.
const yokaiRatios={chouchin:1.6,karakasa:3.5,hitodama:1.25,tanuki:1.9,kitsune:1.8,hyakume:4,umibouzu:4.1,kappa:2.1,nyoro:1.15,usagi:1.25,sharin:4,kuchi:1.8};
const yokaiImages={};
for(const name of [...Object.keys(yokaiRatios),'karakasa-karada','karakasa-ashi','karakasa-kutu']){const img=new Image();img.src=`assets/${name}.png`;yokaiImages[name]=img;}
let yokaiTime=0,yokaiLast=null,yokaiNext=0,yokaiGuests=[];
const randomBetween=(a,b)=>a+Math.random()*(b-a);
function newGuests(){
 const names=Object.keys(yokaiRatios), first=names[Math.floor(Math.random()*names.length)];
 let selected=first==='chouchin'?Array.from({length:Math.random()<.5?2:3},()=>first):first==='tanuki'||first==='kitsune'?['tanuki','kitsune']:[first];
 const count=Math.floor(randomBetween(1,4));
 while(selected.length<count){const candidates=names.filter(n=>!['tanuki','kitsune','chouchin'].includes(n)&&!selected.includes(n));selected.push(candidates[Math.floor(Math.random()*candidates.length)]);}
 // Queue each sprite behind the previous sprite with two seconds of clear space.
 let previous=yokaiGuests.at(-1);
 for(const name of selected){
  const ratio=yokaiRatios[name],img=yokaiImages[name];
  const height=Math.min(scale*frames[0].naturalHeight/(frames[0].naturalWidth||1)*ratio,canvas.height/canvas.width*.60,.65);
  if(!img.naturalWidth)continue;
  const width=height*img.naturalWidth/img.naturalHeight;
  // Conservative horizontal bounds include rotations, stretching, and umbrella parts.
  const radius=name==='sharin'?Math.hypot(width,height)/2:name==='karakasa'?height*.55:width*.55+height*.16;
  const speed=.20;
  const entry=previous?previous.entry+2*previous.radius/speed+2:yokaiTime;
  const g={name,phase:randomBetween(0,Math.PI*2),side:1,entry,radius,height,speed};
  yokaiGuests.push(g);previous=g;
 }
 yokaiNext=Infinity;
}
function paintYokai(name,x,y,height,angle=0,sx=1,sy=1){const img=yokaiImages[name];if(!img?.naturalWidth)return;const width=height*img.naturalWidth/img.naturalHeight;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(sx,sy);ctx.drawImage(img,-width/2,-height,width,height);ctx.restore();}
function paintUmbrella(x,y,height,p){
 const body=yokaiImages['karakasa-karada'],leg=yokaiImages['karakasa-ashi'],shoe=yokaiImages['karakasa-kutu'];
 if(!body.naturalWidth||!leg.naturalWidth||!shoe.naturalWidth){paintYokai('karakasa',x,y,height);return;}
 const k=height/547,bend=(1-Math.abs(Math.sin(p)))*.75;
 ctx.save();ctx.translate(x,y);ctx.scale(k,k);
 // Keep the original PNG's 55-pixel visible width. Only compress its length.
 // The transparent top 127px is excluded instead of shrinking the whole canvas.
 const footY=-24,legLength=182*(1-.24*bend),hipY=footY-legLength;
 ctx.drawImage(leg,0,127,55,182,-8,hipY,55,legLength);
 ctx.drawImage(shoe,12,footY-13,64,74);
 // Keep the body attached to the top of the leg throughout each hop.
 ctx.drawImage(body,-122,hipY-355,244,376);ctx.restore();
}
function drawYokai(t,w,h){
 if(yokaiLast===null)yokaiLast=t;
 if(running)yokaiTime+=Math.min(.1,(t-yokaiLast)/1000);yokaiLast=t;
 if(!canvas.width||!canvas.height||!frames[0].naturalWidth||Object.values(yokaiImages).some(im=>!im.naturalWidth))return;
 yokaiGuests=yokaiGuests.filter(g=>yokaiTime<g.entry+(1+2*g.radius)/g.speed);
 if(yokaiTime>=yokaiNext||!yokaiGuests.length)newGuests();
 const oniH=w*scale*frames[0].naturalHeight/(frames[0].naturalWidth||1),ground=pos.y*h+oniH*.46;
 for(const g of yokaiGuests){const age=yokaiTime-g.entry;if(age<0)continue;
 const p=age*5+g.phase;
 let hh=g.height*w,x=0,y=ground-oniH*.12,angle=0,sx=1,sy=1;
 // Enter and leave fully outside the canvas; never fade in mid-screen.
 const progress=Math.max(0,Math.min(1,age*g.speed/(1+2*g.radius)));
 x=(-g.radius+age*g.speed)*w;
 switch(g.name){
 case 'chouchin':y-=oniH*(1.1+.18*Math.sin(p*.52));angle=Math.sin(p*.45)*.12;break;
 case 'hitodama':y-=oniH*(1.4+.32*Math.sin(p));angle=Math.sin(p*.7)*.13;break;
 case 'karakasa':y-=Math.abs(Math.sin(p))*oniH*.48;break;
 case 'tanuki':case 'kitsune':y=ground-Math.abs(Math.sin(p))*oniH*.08;angle=Math.sin(p)*.045;break;
 case 'hyakume':sy=1+.025*Math.sin(p*.6);sx=1-.025*Math.sin(p*.6);angle=.025*Math.sin(p*.5);break;
 case 'umibouzu':{const pop=Math.min(1,Math.max(0,(progress-.15)/.12));sx=sy=.2+.8*(1-Math.pow(1-pop,3));y+=Math.sin(p*.45)*oniH*.06;break;}
 case 'kappa':y-=Math.abs(Math.sin(p))*oniH*.07;angle=Math.sin(p)*.035;break;
 case 'nyoro':y=Math.min(h*.82,ground+oniH*.12);sy=1+.09*Math.sin(p);angle=Math.sin(p*.8)*.06;break;
 case 'usagi':y-=Math.abs(Math.sin(p*1.2))*oniH*.3;sy=1-.08*Math.cos(p*2.4);break;
 case 'sharin':angle=age*2*g.side; y-=hh*.06;break;
 case 'kuchi':y-=Math.abs(Math.sin(p))*oniH*.055;angle=Math.sin(p)*.045;break;
 }
 y=Math.max(hh+16,Math.min(h*.86,y));ctx.save();ctx.globalAlpha=1;
 if(g.name==='karakasa')paintUmbrella(x,y,hh,p);else if(g.name==='sharin'){ctx.translate(x,y-hh/2);ctx.rotate(angle);paintYokai(g.name,0,hh/2,hh,0,sx,sy);}else paintYokai(g.name,x,y,hh,angle,sx,sy);
 ctx.restore();
 }
}
