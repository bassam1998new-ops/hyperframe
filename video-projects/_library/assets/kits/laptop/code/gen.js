// Laptop mockup generator: simple 3D model, perspective projection, flat ink style.
(function(){
var INK="#2B2420";
var C={deck:"#D3CFC8",well:"#BDB8B0",key:"#35363B",keyTop:"#3E3F45",pad:"#C8C3BB",front:"#B7B2AA",side:"#A39E96",
  lidEdge:"#ABA69E",bezel:"#18191C",lidBack:"#C9C4BC",feet:"#2F2C2A"};
// model units ~ mm
var W=320,D=222,BT=13,LW=320,BZ={side:9,top:11,bot:17},SW=W-2*BZ.side,SH=SW*9/16,LH=SH+BZ.top+BZ.bot,LT=5;
function V(x,y,z){return [x,y,z];}
function add(a,b){return [a[0]+b[0],a[1]+b[1],a[2]+b[2]];}
function mul(a,s){return [a[0]*s,a[1]*s,a[2]*s];}
function model(lidAng){
  var a=lidAng*Math.PI/180, u=[0,Math.cos(a),-Math.sin(a)], n=[0,Math.sin(a),Math.cos(a)];
  var hinge=[0,BT,-D+6];
  function lidP(x,t,off){return add(add(add(hinge,[x,0,0]),mul(u,t)),mul(n,off||0));}
  return {u:u,n:n,lidP:lidP};
}
function makeCam(yaw,pitch,dist){
  var y=yaw*Math.PI/180,p=pitch*Math.PI/180;
  return function(P){
    var x=P[0],yy=P[1]-110,z=P[2]+D/2; // pivot near the middle of the laptop
    var x1=x*Math.cos(y)+z*Math.sin(y), z1=-x*Math.sin(y)+z*Math.cos(y);
    var y2=yy*Math.cos(p)-z1*Math.sin(p), z2=yy*Math.sin(p)+z1*Math.cos(p);
    var s=dist/(dist-z2);
    return [x1*s,-y2*s,z2];
  };
}
function build(opt){
  var M=model(opt.lid), cam=makeCam(opt.yaw,opt.pitch,opt.dist);
  var faces=[]; // {pts:[3d], fill, hatch, stroke}
  function F(pts,fill,o){o=o||{};faces.push({pts:pts,fill:fill,hatch:o.hatch,lw:o.lw,tag:o.tag,noInk:o.noInk});}
  var hw=W/2;
  // --- lid (drawn first: the deck covers its hinge)
  var lt=LH, l=-LW/2, r=LW/2;
  var Lin=[M.lidP(l,0),M.lidP(r,0),M.lidP(r,lt),M.lidP(l,lt)];
  var Lout=[M.lidP(l,0,-LT),M.lidP(r,0,-LT),M.lidP(r,lt,-LT),M.lidP(l,lt,-LT)];
  F([Lin[1],Lout[1],Lout[2],Lin[2]],C.lidEdge,{hatch:.16});
  F([Lin[0],Lout[0],Lout[3],Lin[3]],C.lidEdge,{hatch:.16});
  F([Lin[3],Lin[2],Lout[2],Lout[3]],C.lidEdge,{hatch:.1});
  F(Lin,C.bezel,{tag:"bezel"});
  var S=[M.lidP(-SW/2,BZ.bot,0.01),M.lidP(SW/2,BZ.bot,0.01),M.lidP(SW/2,BZ.bot+SH,0.01),M.lidP(-SW/2,BZ.bot+SH,0.01)];
  var cam3=M.lidP(0,LH-BZ.top/2,0.02);
  // --- base
  var y0=0,y1=BT, zf=0, zb=-D;
  var B=[[-hw,y0,zf],[hw,y0,zf],[hw,y0,zb],[-hw,y0,zb],[-hw,y1,zf],[hw,y1,zf],[hw,y1,zb],[-hw,y1,zb]];
  F([B[0],B[1],B[5],B[4]],C.front,{hatch:.12,tag:"front"});
  if(opt.yaw>0) F([B[1],B[2],B[6],B[5]],C.side,{hatch:.22});
  if(opt.yaw<0) F([B[3],B[0],B[4],B[7]],C.side,{hatch:.22});
  F([B[4],B[5],B[6],B[7]],C.deck,{tag:"deck"});
  // keyboard well + keys
  var kx=hw-22, kz0=-D+18, kz1=-D+18+98;
  F([[-kx,y1,kz1],[kx,y1,kz1],[kx,y1,kz0],[-kx,y1,kz0]],C.well,{lw:.5});
  var rows=[{n:14,h:9},{n:14,h:15},{n:14,h:15},{n:13,h:15},{n:12,h:15},{n:0,h:15}];
  var z=kz0+4, gap=2.4;
  var kw=(2*kx-8);
  rows.forEach(function(row,ri){
    var hgt=row.h;
    if(ri==5){ // space row: mods + space + arrows
      var parts=[1,1,1.25,5.5,1.25,1,1,1];
      var tot=parts.reduce(function(a,b){return a+b;}),xx=-kx+4;
      parts.forEach(function(p){var w=p/tot*(kw)-gap;F([[xx,y1,z+hgt],[xx+w,y1,z+hgt],[xx+w,y1,z],[xx,y1,z]],C.key,{lw:.35,noInk:false});xx+=w+gap;});
    } else {
      var widths=[];for(var i=0;i<row.n;i++)widths.push(1);
      if(ri==1)widths[13]=1.5; if(ri==2){widths[0]=1.5;} if(ri==3){widths[0]=1.8;widths[12]=1.8;} if(ri==4){widths[0]=2.3;widths[11]=2.3;}
      var tot=widths.reduce(function(a,b){return a+b;}),xx=-kx+4;
      widths.forEach(function(p){var w=p/tot*(kw)-gap;F([[xx,y1,z+hgt-gap],[xx+w,y1,z+hgt-gap],[xx+w,y1,z],[xx,y1,z]],C.key,{lw:.35});xx+=w+gap;});
    }
    z+=hgt;
  });
  // trackpad
  var pz1=-8, pz0=-8-74, px=58;
  F([[-px,y1,pz1],[px,y1,pz1],[px,y1,pz0],[-px,y1,pz0]],C.pad,{lw:.6});
  // front notch (thumb scoop) as a thin line
  return {faces:faces,cam:cam,screen:S,camDot:cam3,model:M};
}
function project(b){
  var all=[];b.faces.forEach(function(f){f.p=f.pts.map(b.cam);all=all.concat(f.p);});
  b.sp=b.screen.map(b.cam); b.cd=b.cam(b.camDot);
  var minx=1e9,maxx=-1e9,miny=1e9,maxy=-1e9;all.forEach(function(p){minx=Math.min(minx,p[0]);maxx=Math.max(maxx,p[0]);miny=Math.min(miny,p[1]);maxy=Math.max(maxy,p[1]);});
  b.bb={minx:minx,maxx:maxx,miny:miny,maxy:maxy};
}
function hatchFace(c,pts,alpha,sp){
  c.save();c.beginPath();pts.forEach(function(p,i){i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]);});c.closePath();c.clip();
  var minx=1e9,maxx=-1e9,miny=1e9,maxy=-1e9;pts.forEach(function(p){minx=Math.min(minx,p[0]);maxx=Math.max(maxx,p[0]);miny=Math.min(miny,p[1]);maxy=Math.max(maxy,p[1]);});
  c.strokeStyle="rgba(43,36,32,"+alpha+")";c.lineWidth=sp*.16;c.lineCap="round";
  var h=maxy-miny;for(var x=minx-h;x<maxx+h;x+=sp){c.beginPath();c.moveTo(x,maxy+2);c.lineTo(x+h+4,miny-2);c.stroke();}
  c.restore();
}
// draw: returns {canvas, screen corners in px, ...}
window.renderLaptop=function(opt){
  var b=build(opt);project(b);
  var bb=b.bb, sc=opt.screenPx/Math.hypot(b.sp[1][0]-b.sp[0][0],b.sp[1][1]-b.sp[0][1]);
  var pad=opt.pad, cw=Math.ceil((bb.maxx-bb.minx)*sc+2*pad), ch=Math.ceil((bb.maxy-bb.miny)*sc+2*pad+opt.padBottom);
  function T(p){return [(p[0]-bb.minx)*sc+pad,(p[1]-bb.miny)*sc+pad];}
  var ink=opt.ink*sc/6;
  function layer(){var cv=document.createElement("canvas");cv.width=cw;cv.height=ch;return cv;}
  var body=layer(),c=body.getContext("2d");c.lineJoin="round";c.lineCap="round";
  b.faces.forEach(function(f){
    var pts=f.p.map(T);
    c.beginPath();pts.forEach(function(p,i){i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]);});c.closePath();
    c.fillStyle=f.fill;c.fill();
    if(f.hatch){hatchFace(c,pts,f.hatch,ink*3.2);c.beginPath();pts.forEach(function(p,i){i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]);});c.closePath();}
    c.strokeStyle=INK;c.lineWidth=ink*(f.lw||1);c.stroke();
  });
  var S=b.sp.map(T);
  // camera dot
  var cd=T(b.cd);c.fillStyle="#2C2E33";c.beginPath();c.arc(cd[0],cd[1],ink*1.1,0,7);c.fill();
  c.fillStyle="rgba(120,140,170,.6)";c.beginPath();c.arc(cd[0]-ink*.3,cd[1]-ink*.3,ink*.35,0,7);c.fill();
  // deck sheen: soft light band on the deck (top highlight)
  // screen: punch hole
  function screenPath(cx){cx.beginPath();S.forEach(function(p,i){i?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1]);});cx.closePath();}
  var solid=layer(),s2=solid.getContext("2d");s2.drawImage(body,0,0);screenPath(s2);s2.fillStyle="#8E8B87";s2.fill();
  c.save();c.globalCompositeOperation="destination-out";screenPath(c);c.fillStyle="#000";c.fill();c.restore();
  // mask
  var mask=layer(),m=mask.getContext("2d");m.fillStyle="#000";m.fillRect(0,0,cw,ch);screenPath(m);m.fillStyle="#fff";m.fill();
  // glass: faint diagonal glare, only inside the screen
  var glass=layer(),g=glass.getContext("2d");g.save();screenPath(g);g.clip();
  var gx0=Math.min(S[0][0],S[3][0]),gx1=Math.max(S[1][0],S[2][0]),gy0=Math.min(S[2][1],S[3][1]),gy1=Math.max(S[0][1],S[1][1]);
  var gr=g.createLinearGradient(gx0,gy0,gx1,gy1);gr.addColorStop(0,"rgba(255,255,255,0.10)");gr.addColorStop(.35,"rgba(255,255,255,0.03)");gr.addColorStop(.36,"rgba(255,255,255,0)");gr.addColorStop(1,"rgba(255,255,255,0)");
  g.fillStyle=gr;g.fillRect(0,0,cw,ch);
  // inner bezel line so the screenshot edge looks seated
  g.restore();screenPath(g);g.strokeStyle="rgba(0,0,0,.55)";g.lineWidth=ink*.6;g.stroke();
  // shadow: base footprint, blurred
  var shadow=layer(),sh=shadow.getContext("2d");
  var fp=[[-W/2,0,0],[W/2,0,0],[W/2,0,-D],[-W/2,0,-D]].map(b.cam).map(T);
  sh.filter="blur("+Math.round(ink*7)+"px)";sh.fillStyle="rgba(40,30,20,.30)";
  sh.beginPath();fp.forEach(function(p,i){var q=[p[0],p[1]+ink*4];i?sh.lineTo(q[0],q[1]):sh.moveTo(q[0],q[1]);});sh.closePath();sh.fill();
  sh.filter="blur("+Math.round(ink*2)+"px)";sh.fillStyle="rgba(40,30,20,.35)";
  sh.beginPath();[fp[0],fp[1]].forEach(function(p,i){i?sh.lineTo(p[0],p[1]+ink*1.5):sh.moveTo(p[0],p[1]+ink*1.5);});sh.lineTo(fp[1][0],fp[1][1]-ink);sh.lineTo(fp[0][0],fp[0][1]-ink);sh.closePath();sh.fill();
  return {w:cw,h:ch,corners:[S[3],S[2],S[1],S[0]].map(function(p){return [+p[0].toFixed(2),+p[1].toFixed(2)];}),
    layers:{body:body,solid:solid,mask:mask,glass:glass,shadow:shadow}};
};
// a neutral test card (grid + corner marks), NOT a fake app
window.testCard=function(w,h){
  var cv=document.createElement("canvas");cv.width=w;cv.height=h;var c=cv.getContext("2d");
  c.fillStyle="#F4F1EA";c.fillRect(0,0,w,h);c.strokeStyle="#D8D2C6";c.lineWidth=2;
  for(var x=0;x<=w;x+=120){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}
  for(var y=0;y<=h;y+=120){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
  var cols=["#E4572E","#2E86AB","#F2A541","#3BB273"];
  [[0,0],[w,0],[w,h],[0,h]].forEach(function(p,i){c.fillStyle=cols[i];c.beginPath();c.arc(p[0],p[1],90,0,7);c.fill();});
  c.strokeStyle="#2B2420";c.lineWidth=8;c.strokeRect(4,4,w-8,h-8);
  c.beginPath();c.moveTo(0,0);c.lineTo(w,h);c.moveTo(w,0);c.lineTo(0,h);c.lineWidth=3;c.stroke();
  c.beginPath();c.arc(w/2,h/2,h/4,0,7);c.stroke();
  return cv;
};
})();
