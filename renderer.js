/* Original procedural world artwork and animated characters for 山海问剑. */
(function () {
  'use strict';
  const TAU = Math.PI * 2, W = 3200, H = 2400;
  function rng(seed) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
  function ellipse(c, x, y, rx, ry, fill, stroke, lw = 1) {
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU);
    if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
  }
  function path(c, pts, fill, stroke, lw = 1, close = true) {
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    if (close) c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
  }
  function line(c, pts, color, lw = 1) { path(c, pts, null, color, lw, false); }
  function shadow(c, x, y, rx = 20, ry = 7, a = .2) { ellipse(c, x + 5, y + 3, rx, ry, `rgba(7,25,26,${a})`); }
  function label(c, text, x, y, color = '#ecedd6', size = 12) {
    c.font = `${size}px "Microsoft YaHei", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 3; c.strokeStyle = 'rgba(11,29,30,.8)'; c.strokeText(text, x, y); c.fillStyle = color; c.fillText(text, x, y);
  }
  class Renderer {
    constructor(canvas) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: false });
      this.width = 1280; this.height = 720; this.camera = { x: 550, y: 1780 }; this.zoom = 1.1; this.t = 0;
      this.sprites = {};
      this.loadSprite('pine', 'assets/pine.png', 188, 240);
      this.loadSprite('cultivator', 'assets/cultivator.png', 176, 176);
      this.scenery = []; this.terrain = document.createElement('canvas'); this.terrain.width = W; this.terrain.height = H;
      this.makeWorld(); this.resize();
    }
    loadSprite(name, url, width, height) {
      const source = new Image();
      source.onload = () => {
        const cache = document.createElement('canvas'); cache.width = width; cache.height = height;
        const ctx = cache.getContext('2d'); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(source, 0, 0, width, height); this.sprites[name] = cache;
      };
      source.src = url;
    }
    resize() {
      const b = this.canvas.getBoundingClientRect(); this.width = b.width || innerWidth; this.height = b.height || innerHeight;
      this.dpr = Math.min(devicePixelRatio || 1, 2); this.canvas.width = Math.round(this.width * this.dpr); this.canvas.height = Math.round(this.height * this.dpr);
      this.zoom = this.width < 1000 ? .94 : 1.13;
    }
    screenToWorld(x, y) {
      const b = this.canvas.getBoundingClientRect(); return { x: (x - b.left - this.width / 2) / this.zoom + this.camera.x, y: (y - b.top - this.height / 2) / this.zoom + this.camera.y };
    }
    makeWorld() {
      const c = this.terrain.getContext('2d'), rand = rng(861239);
      c.fillStyle = '#688b70'; c.fillRect(0, 0, W, H);
      // Broad areas of softly blended vegetation and an old eastern temple complex.
      for (let i = 0; i < 85; i++) {
        const x = rand() * W, y = rand() * H, r = 70 + rand() * 300;
        const g = c.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, i % 3 ? 'rgba(161,182,121,.21)' : 'rgba(31,73,65,.2)'); g.addColorStop(1, 'rgba(89,123,88,0)'); c.fillStyle = g; c.fillRect(x-r,y-r,r*2,r*2);
      }
      const bamboo = c.createLinearGradient(1500, 0, 2250, 0); bamboo.addColorStop(0, '#668b7100'); bamboo.addColorStop(.6, '#427767aa'); bamboo.addColorStop(1, '#2d625dbb');
      c.fillStyle = bamboo; c.fillRect(1500, 0, 1750, 1350);
      const ruin = c.createLinearGradient(2150, 0, 2850, 0); ruin.addColorStop(0, '#84908800'); ruin.addColorStop(1, '#858f83'); c.fillStyle = ruin; c.fillRect(2150, 0, 1050, H);
      // Curving traversable pathways connect every objective.
      const road = (color, width) => {
        c.beginPath(); c.moveTo(510, 1920); c.bezierCurveTo(710, 1760, 880, 1690, 1120, 1640); c.bezierCurveTo(1440, 1590, 1610, 1350, 1750, 1170); c.bezierCurveTo(1910, 960, 1760, 790, 2000, 690); c.bezierCurveTo(2260, 605, 2410, 800, 2820, 650);
        c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.stroke();
      };
      road('rgba(43,79,59,.13)', 114); road('#a8ad85', 85); road('rgba(210,208,162,.27)', 54);
      c.beginPath(); c.moveTo(1070,1640); c.bezierCurveTo(1170,1800,1850,1830,2430,1590); c.strokeStyle='#a0a386'; c.lineWidth=55; c.stroke();
      // Ground flecks, grass tuft strokes, and path gravel remain part of the cached map.
      for (let i = 0; i < 19000; i++) {
        const x = rand()*W, y = rand()*H; c.fillStyle = i % 2 ? 'rgba(224,224,167,.13)' : 'rgba(23,65,46,.12)';
        c.fillRect(x,y,1+rand()*3,1+rand()*2);
      }
      for (let i = 0; i < 2900; i++) {
        const x=rand()*W,y=rand()*H; c.strokeStyle=i%2?'rgba(26,75,53,.24)':'rgba(196,210,143,.26)';c.lineWidth=1;
        line(c,[[x-3,y],[x-2,y-5],[x,y]],c.strokeStyle);line(c,[[x,y],[x+2,y-7],[x+4,y]],c.strokeStyle);
      }
      this.water(c,1350,700,230,155); this.water(c,2430,2000,160,120);
      // Starting mountain village courtyard.
      ellipse(c,505,1830,256,191,'rgba(45,80,68,.16)'); ellipse(c,500,1810,247,180,'#adb598');
      for(let y=1650;y<1960;y+=28) for(let x=300;x<750;x+=40) {
        if(((x-500)/242)**2+((y-1810)/169)**2>1)continue;
        c.strokeStyle='rgba(83,104,89,.18)';c.strokeRect(x+(Math.floor(y/28)%2)*20,y,39,27);
      }
      // Celestial sigils mark the three arenas, never block movement.
      [[1450,1580,103,'#b7bda1'],[2020,650,126,'#73a99b'],[2790,650,157,'#b7b4a0']].forEach(([x,y,r,col],i)=>{
        ellipse(c,x,y,r,r*.7,col); ellipse(c,x,y,r-12,(r-12)*.7,null,'rgba(34,77,65,.3)',2);
        ellipse(c,x,y,r-25,(r-25)*.7,null,'rgba(228,232,193,.4)',1);
        for(let a=0;a<TAU;a+=TAU/8){const px=x+Math.cos(a)*(r-17),py=y+Math.sin(a)*(r-17)*.7;line(c,[[px-4,py-3],[px+4,py+3]],'rgba(36,79,68,.4)',2);}
        if(i===2){ellipse(c,x,y,67,43,null,'#d3c186',2);ellipse(c,x,y,40,27,null,'#d3c186');}
      });
      // Broken eastern flagstones.
      for(let i=0;i<160;i++){const x=2270+rand()*850,y=250+rand()*1470; const a=12+rand()*23;path(c,[[x,y],[x+a,y-3],[x+a+4,y+14],[x+5,y+18]],'rgba(181,186,166,.33)','rgba(58,79,73,.15)');}
      const onRoad = (x,y) => {
        if (x<1000&&y>1400) return Math.hypot(x-520,y-1800)<355;
        if (Math.hypot(x-1450,y-1580)<160||Math.hypot(x-2020,y-650)<185||Math.hypot(x-2790,y-650)<215) return true;
        if (x<1850&&x>750&&Math.abs(y-(1850-x*.25))<100) return true;
        if(x>1600&&x<2050&&y<1300&&Math.abs(x-(1900+(y-900)*-.14))<100)return true;
        if(x>2050&&Math.abs(y-710)<95)return true;
        return false;
      };
      for(let i=0;i<440;i++){
        const x=70+rand()*(W-140),y=80+rand()*(H-160);
        if(onRoad(x,y)||((x-1350)/270)**2+((y-700)/190)**2<1||((x-2430)/190)**2+((y-2000)/150)**2<1)continue;
        const type=x>1600&&y<1300?'bamboo':x>2250?(rand()<.5?'rock':'pine'):(rand()<.72?'pine':'bush');
        this.scenery.push({type,x,y,scale:.7+rand()*.7,seed:rand()*1000});
      }
      [{type:'gate',x:765,y:1640,scale:1},{type:'temple',x:430,y:1600,scale:1},
        {type:'forge',x:670,y:1800,scale:1},{type:'alchemy',x:380,y:1900,scale:1},
        {type:'shrine',x:580,y:1970,scale:1},{type:'master',x:440,y:1680,scale:1},
        {type:'ruinGate',x:2510,y:470,scale:1.25},{type:'ruinGate',x:2970,y:870,scale:.8}].forEach(d=>this.scenery.push(d));
      // Every solid engine boulder has a visible matching silhouette.
      for(const o of window.Xian.OBSTACLES||[])this.scenery.push({type:'rock',x:o.x,y:o.y+o.radius*.3,scale:o.radius/22,seed:0});
      // Shadows from tall mountains at the edges, emphasizing playable valleys.
      for(let j=0;j<4;j++){
        const grad=c.createLinearGradient(j===1?W:0,j===3?H:0,j===0?180:j===1?W-180:0,j===2?150:j===3?H-160:0);
        grad.addColorStop(0,'rgba(15,48,45,.6)');grad.addColorStop(1,'rgba(15,48,45,0)');c.fillStyle=grad;
        c.fillRect(j===1?W-180:0,j===3?H-160:0,j<2?180:W,j<2?H:160);
      }
    }
    water(c,x,y,rx,ry){
      ellipse(c,x+3,y+8,rx+15,ry+10,'#567661'); ellipse(c,x,y,rx+5,ry+3,'#9dae8b');
      const g=c.createLinearGradient(x,y-ry,x,y+ry);g.addColorStop(0,'#2d6767');g.addColorStop(.6,'#4e9690');g.addColorStop(1,'#88b6a3');ellipse(c,x,y,rx,ry,g);
      for(let i=0;i<28;i++){const yy=y-ry+10+i*ry*2/28,xx=rx*Math.sqrt(Math.max(0,1-((yy-y)/ry)**2));line(c,[[x-xx*.83,yy],[x+xx*.68,yy]],'rgba(177,220,192,.13)',1);}
      for(let i=0;i<7;i++){const xx=x+Math.cos(i*1.9)*rx*.75,yy=y+Math.sin(i*1.9)*ry*.64;ellipse(c,xx,yy,9,4,'#80a16c');ellipse(c,xx+1,yy-2,2.5,2,'#efcaba');}
    }
    draw(state, dt=0.016){
      const c=this.ctx; this.t += Math.min(dt,.1); const p=state.player; this.currentPlayer = p;
      this.camera.x=p.x;this.camera.y=p.y;
      // Clamp the viewport to the world edge where possible.
      const hw=this.width/(2*this.zoom),hh=this.height/(2*this.zoom);
      this.camera.x=hw<W/2?Math.max(hw,Math.min(W-hw,p.x)):W/2;
      this.camera.y=hh<H/2?Math.max(hh,Math.min(H-hh,p.y)):H/2;
      c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle='#32564c';c.fillRect(0,0,this.width,this.height);
      c.translate(this.width/2,this.height/2);c.scale(this.zoom,this.zoom);c.translate(-this.camera.x,-this.camera.y);
      c.drawImage(this.terrain,0,0);
      const visible=o=>Math.abs(o.x-this.camera.x)<hw+150&&Math.abs(o.y-this.camera.y)<hh+170;
      // Ground based effects behind characters, so every attack remains legible.
      for(const fx of state.effects||[])if(visible(fx)&&['warning','ring','burst','impact','heal'].includes(fx.type))this.effect(c,fx);
      const items=this.scenery.filter(visible).map(o=>({kind:'scenery',o}));
      for(const o of state.nodes||[])if(visible(o))items.push({kind:'node',o});
      for(const o of state.drops||[])if(visible(o))items.push({kind:'drop',o});
      for(const o of state.enemies||[])if(visible(o)&&o.hp>0)items.push({kind:'enemy',o});
      items.push({kind:'player',o:p});items.sort((a,b)=>a.o.y-b.o.y);
      for(const item of items){
        if(item.kind==='scenery')this.scenerySprite(c,item.o);
        else if(item.kind==='node')this.node(c,item.o,p);
        else if(item.kind==='drop')this.drop(c,item.o);
        else if(item.kind==='enemy')this.enemy(c,item.o,p);
        else this.player(c,p,state);
      }
      for(const o of state.projectiles||[])if(visible(o))this.projectile(c,o);
      for(const fx of state.effects||[])if(visible(fx)&&!['warning','ring','burst','impact','heal'].includes(fx.type))this.effect(c,fx);
      // Fireflies, drifting leaves and motes evoke cultivation without obscuring combat.
      for(let i=0;i<24;i++){
        const x=this.camera.x+Math.sin(i*6.3+this.t*.12)*hw,y=this.camera.y+Math.cos(i*4.7+this.t*.17)*hh;
        c.globalAlpha=.25+Math.sin(this.t*2+i)*.16;ellipse(c,x,y,1.6,1.6,'#dae8b1');
      }c.globalAlpha=1;
      const npcs=[['master',440,1680,'问道 · 凌云真人'],['forge',670,1800,'炼器 · 铸剑台'],['alchemy',380,1900,'炼丹 · 灵药炉'],['shrine',580,1970,'修行 · 聚灵阵']];
      for(const [,x,y,title] of npcs){if(Math.hypot(p.x-x,p.y-y)<135){label(c,title,x,y-84,'#f0e4b6',12);if(Math.hypot(p.x-x,p.y-y)<105)label(c,'[ E ] 交互',x,y+34,'#fcf3d4',11);}}
      // Viewport atmosphere applied in screen space.
      c.setTransform(this.dpr,0,0,this.dpr,0,0);
      const vignette=c.createRadialGradient(this.width/2,this.height/2,this.height*.2,this.width/2,this.height/2,this.width*.66);
      vignette.addColorStop(0,'rgba(7,29,29,0)');vignette.addColorStop(1,'rgba(7,29,29,.38)');c.fillStyle=vignette;c.fillRect(0,0,this.width,this.height);
    }
    scenerySprite(c,o){
      c.save();c.translate(o.x,o.y);c.scale(o.scale||1,o.scale||1);
      const sway=Math.sin(this.t*1.1+(o.seed||0))*.012;
      switch(o.type){
        case 'pine':{
          if(this.sprites.pine){
            shadow(c,0,0,32,11,.2);
            const p=this.currentPlayer;
            if(p&&Math.abs(p.x-o.x)<50*(o.scale||1)&&p.y<o.y&&p.y>o.y-110*(o.scale||1))c.globalAlpha=.4;
            c.rotate(sway);if((o.seed||0)%2>1)c.scale(-1,1);c.drawImage(this.sprites.pine,-47,-116,94,120);break;
          }
          shadow(c,0,0,29,11,.16);c.rotate(sway);path(c,[[-5,0],[-3,-65],[3,-65],[6,0]],'#5a6550');
          for(let i=0;i<4;i++){const y=-30-i*16,w=33-i*4;path(c,[[-w,y],[0,y-37],[w,y],[-w*.4,y+3]],i%2?'#376554':'#3f7258');line(c,[[-w+8,y-2],[0,y-29],[w-8,y-2]],'#578260',2);}
          break;
        }
        case 'bamboo':{
          shadow(c,0,0,22,6,.12);
          for(let i=0;i<5;i++){const x=(i-2)*9,ht=66+(i%3)*19;line(c,[[x,0],[x+Math.sin(this.t+i)*2,-ht]],'#416e52',4);line(c,[[x-1,0],[x-1,-ht]],'#75a57b',1);
            for(let k=14;k<ht;k+=16){line(c,[[x-2,-k],[x+2,-k]],'#b3c798',1);for(let side of [-1,1]){path(c,[[x,-k],[x+side*25,-k-9],[x+side*9,-k-2]],'#326851');path(c,[[x,-k-6],[x+side*16,-k-24],[x+side*6,-k-10]],'#538a62');}}
          }break;
        }
        case 'rock':{
          shadow(c,0,0,21,9,.15);path(c,[[-24,-4],[-18,-24],[-1,-34],[18,-23],[23,-3],[9,5]],'#7e8c80','#566b63');path(c,[[-18,-24],[-1,-34],[5,-14],[-5,1],[-24,-4]],'#9eaa93');line(c,[[-1,-30],[5,-14],[18,-23]],'#bbc1a4',1);ellipse(c,-8,-2,10,3,'#6a855c');break;
        }
        case 'bush':{
          shadow(c,0,0,24,8,.13);ellipse(c,-12,-10,16,12,'#4c7c57');ellipse(c,6,-16,20,16,'#629268');ellipse(c,22,-7,14,9,'#507d58');ellipse(c,-2,-23,12,6,'#78a575');break;
        }
        case 'temple':this.building(c,150,85,'#2d6864',true);break;
        case 'forge':{
          this.building(c,77,48,'#786b51',false);path(c,[[-20,0],[-25,-11],[22,-11],[28,-19],[31,-15],[19,-2],[10,0],[14,12],[-12,12],[-8,0]],'#354c4b','#b3b29b');ellipse(c,32,-5,8,4,'#cf8e48');ellipse(c,31,-11,4,8,'#efb563');break;
        }
        case 'alchemy':{
          shadow(c,0,0,42,13);line(c,[[-37,0],[-37,-63],[37,-63],[37,0]],'#5b6650',4);path(c,[[-48,-56],[0,-77],[47,-56],[31,-51],[-31,-51]],'#697c61','#acc09b');
          ellipse(c,0,3,24,8,'#2c5352');ellipse(c,0,-13,25,24,'#436561','#abc2a5',2);ellipse(c,0,-32,25,8,'#214947','#94b396',2);ellipse(c,0,-34,18,5,'#679a7c');line(c,[[-20,-15],[-30,-22],[-28,-29],[-20,-26]],'#bfd0aa',3);line(c,[[20,-15],[30,-22],[28,-29],[20,-26]],'#bfd0aa',3);
          for(let i=0;i<3;i++){c.globalAlpha=.18;ellipse(c,Math.sin(this.t+i)*10,-44-i*12,9+i*3,6,'#cbe9c9');}c.globalAlpha=1;break;
        }
        case 'shrine':{
          shadow(c,0,0,49,19);ellipse(c,0,0,49,25,'#758c80','#c4c7a7',2);ellipse(c,0,-3,39,19,null,'#c4c7a7');
          for(let i=0;i<6;i++){const a=i*TAU/6+this.t*.07;line(c,[[Math.cos(a)*30,Math.sin(a)*14-3],[Math.cos(a+.3)*20,Math.sin(a+.3)*9-3]],'#a8dbb0',2);}
          const g=c.createRadialGradient(0,-14,1,0,-14,36);g.addColorStop(0,'rgba(126,232,192,.4)');g.addColorStop(1,'rgba(126,232,192,0)');ellipse(c,0,-14,36,36,g);path(c,[[0,-41],[9,-23],[0,-10],[-9,-23]],'#9ed5b4','#edf6c8',1);break;
        }
        case 'master':this.human(c,'#496f86','#c4dbc8',false,this.t,0);break;
        case 'gate':case 'ruinGate':{
          const old=o.type==='ruinGate';shadow(c,0,0,65,14);for(const x of [-45,45]){path(c,[[x-7,2],[x-7,-88],[x+7,-88],[x+7,2]],old?'#839088':'#634e38','#b3b798');path(c,[[x-13,1],[x-13,9],[x+13,9],[x+13,1]],'#939f8d');}
          path(c,[[-60,-85],[0,-108],[60,-85],[47,-81],[-47,-81]],old?'#55756e':'#31675e','#a8baa0',2);path(c,[[-57,-83],[0,-96],[58,-83],[38,-73],[-38,-73]],'#4e7b6d');
          c.fillStyle='#526e63';c.fillRect(-20,-81,40,17);label(c,old?'古墟':'青云',0,-71,'#d5c792',12);break;
        }
      }c.restore();
    }
    building(c,w,h,roof,ornate){
      shadow(c,0,0,w*.64,20,.2);path(c,[[-w*.43,0],[-w*.43,-h],[w*.43,-h],[w*.43,0]],'#c2c2a5','#748d79');
      c.fillStyle='#5c776b';c.fillRect(-w*.17,-h*.66,w*.34,h*.66);
      for(const x of [-w*.36,w*.3]){c.fillStyle='#5d7465';c.fillRect(x,-h*.77,w*.1,h*.35);line(c,[[x+w*.05,-h*.75],[x+w*.05,-h*.45]],'#b3c09e',1);}
      path(c,[[-w*.58,-h*.9],[-w*.35,-h*1.15],[0,-h*1.38],[w*.35,-h*1.15],[w*.58,-h*.9],[w*.38,-h*.85],[-w*.38,-h*.85]],roof,'#9fb397',2);
      for(let i=-6;i<=6;i++)line(c,[[i*w*.065,-h*.9],[i*w*.041,-h*1.19]],'rgba(173,200,168,.25)',1);
      line(c,[[-w*.57,-h*.9],[0,-h*1.1],[w*.57,-h*.9]],'#a6bca0',2);
      if(ornate){path(c,[[-w*.33,-h*1.35],[0,-h*1.67],[w*.33,-h*1.35],[w*.24,-h*1.28],[-w*.24,-h*1.28]],roof,'#abc4a0',2);c.fillStyle='#3c6157';c.fillRect(-24,-h*.86,48,16);label(c,'青云观',0,-h*.76,'#e8d4a0',11);}
      path(c,[[-w*.5,0],[-w*.56,9],[w*.56,9],[w*.5,0]],'#a5b099');
      for(const x of [-w*.4,w*.4]){line(c,[[x,-h*.88],[x,-h*.69]],'#8e6c4a',2);ellipse(c,x,-h*.57,6,9,'#c6aa6d','#e3cd93');}
    }
    human(c,robe,trim,player,t,facing,moving=false){
      const walk=moving?Math.sin(t*13):0;shadow(c,0,1,14,6,.24);
      line(c,[[-5,-3],[-6+walk*2,3]],'#243c3c',5);line(c,[[5,-3],[6-walk*2,3]],'#243c3c',5);
      // Hair and long, layered robe silhouettes remain readable at gameplay scale.
      path(c,[[-7,-35],[-11,-22],[-9,-10],[-1,-19],[9,-8],[10,-29],[5,-37]],'#1c373b');
      path(c,[[-7,-25],[-15,-12],[-11,-8],[-6,-18],[-12,0],[1,4],[14,0],[6,-18],[14,-9],[17,-13],[8,-25]],robe,'#244f4b',1);
      path(c,[[-3,-24],[-7,-3],[2,3],[5,-3],[3,-24]],trim);
      line(c,[[-9,-11],[10,-11]],'#ccad73',2);
      path(c,[[-12,-14],[-17,-5],[-12,-4],[-7,-13]],robe);path(c,[[11,-14],[18,-6],[14,-3],[6,-13]],robe);
      ellipse(c,0,-29,6.5,8,'#e0c7a1');path(c,[[-7,-30],[-6,-36],[0,-40],[6,-36],[7,-28],[2,-33]],'#1c373b');ellipse(c,1,-40,4,3,'#1c373b');line(c,[[-5,-39],[7,-39]],'#c9b478',1.5);
      if(player){
        const a=facing||0;c.save();c.translate(11,-14);c.rotate(a+.65);
        path(c,[[0,1],[-2,-34],[0,-43],[3,-34],[3,1]],'#e9edca','#78b2a4');line(c,[[-6,1],[8,1]],'#dbbf7f',3);line(c,[[1,1],[1,9]],'#4a6560',3);c.restore();
        const scarf=Math.sin(t*3)*4;path(c,[[-2,-23],[-20,-19],[-29,-10+scarf],[-18,-13],[-2,-20]],'#dde8c3');
      }
    }
    player(c,p,state){
      c.save();c.translate(p.x,p.y);
      if(p.invuln>0){ellipse(c,0,-15,22,27,null,'rgba(170,239,213,.65)',1.5);c.globalAlpha=.72+.28*Math.sin(this.t*30);}
      if(p.dashCd>0&&p.invuln>0){for(let i=1;i<4;i++){c.globalAlpha=.13;ellipse(c,-Math.cos(p.facing||0)*i*12,-Math.sin(p.facing||0)*i*12-14,10,21,'#ccebdc');}c.globalAlpha=1;}
      ellipse(c,0,3,18,7,null,'rgba(181,221,183,.45)',1);
      if(this.sprites.cultivator){
        shadow(c,0,1,17,6,.23);
        const moving=p.moving||p.isMoving,bob=moving?Math.sin(this.t*13)*1.5:Math.sin(this.t*2)*.5;
        c.save();c.scale(Math.cos(p.facing||0)<0?-1:1,1);c.rotate(moving?Math.sin(this.t*13)*.02:0);
        c.drawImage(this.sprites.cultivator,-37,-67+bob,74,74);c.restore();
      }else this.human(c,'#e6e4c8','#487c74',true,this.t,p.facing,p.moving||p.isMoving);
      if(state.dead){c.globalAlpha=.5;ellipse(c,0,-20,21,26,'#728787');}c.restore();
    }
    enemy(c,e,p){
      c.save();c.translate(e.x,e.y);const boss=e.boss||['wolfKing','ancientTree','guardian'].includes(e.type), gated=e.gated;
      if(gated)c.globalAlpha=.6;
      const bob=Math.sin(this.t*4+(typeof e.id==='number'?e.id:0))*2;
      if(e.hit>0){c.shadowColor='#ffefd3';c.shadowBlur=15;}
      if(e.type==='wolf'||e.type==='wolfKing'){
        const s=boss?1.9:1;c.scale(s,s);shadow(c,0,0,18,7);
        const facing=p.x<e.x?-1:1;c.scale(facing,1);
        path(c,[[-15,-9],[-23,-18],[-22,-6],[-14,-3]],boss?'#abbfc3':'#9a9e86');
        line(c,[[-8,-8],[-10,2]],'#586b62',4);line(c,[[10,-8],[13,1]],'#586b62',4);
        ellipse(c,0,-11+bob*.3,17,10,boss?'#bacbcb':'#aeb196');ellipse(c,14,-15+bob*.3,9,8,boss?'#cfdddd':'#c5c4a7');
        path(c,[[10,-19],[8,-28],[15,-23],[18,-25],[23,-19]],boss?'#94b1b5':'#899780');path(c,[[17,-15],[27,-11],[23,-7],[17,-8]],boss?'#bccdc9':'#b7bb9e');ellipse(c,18,-16,1.8,1.3,boss?'#edbd6e':'#dcbd67');
        if(boss){path(c,[[-12,-17],[-8,-29],[-2,-23],[3,-31],[7,-21],[11,-25],[14,-15]],'#dae5dc');line(c,[[-6,-22],[3,-25],[9,-19]],'#699eab',2);}
      }else if(e.type==='spirit'){
        shadow(c,0,0,17,6,.13);const g=c.createRadialGradient(0,-22,1,0,-22,35);g.addColorStop(0,'rgba(142,228,195,.45)');g.addColorStop(1,'rgba(142,228,195,0)');ellipse(c,0,-22,35,35,g);
        path(c,[[0,-47+bob],[-15,-31+bob],[-14,-17+bob],[-7,-7+bob],[0,-12+bob],[8,-4+bob],[16,-21+bob],[9,-36+bob]],'#75b8a3','#b9e4c5',1);ellipse(c,-4,-28+bob,2,2,'#eff2ce');ellipse(c,5,-28+bob,2,2,'#eff2ce');
      }else if(e.type==='ancientTree'){
        shadow(c,0,0,49,18,.23);path(c,[[-24,2],[-36,7],[-28,-20],[-18,-58],[18,-58],[27,-19],[41,9],[18,2],[8,-11],[-6,-9]],'#596f56','#99ab78',2);
        line(c,[[-20,-44],[-47,-56],[-53,-39]],'#596f56',12);line(c,[[20,-44],[44,-62],[58,-52]],'#596f56',12);
        for(let i=0;i<5;i++)ellipse(c,Math.cos(i*1.3)*31,-65+Math.sin(i*1.3)*14,29,24,i%2?'#4e8b65':'#659b70','#8cac7b');
        path(c,[[-15,-37],[-4,-33],[-12,-29]],'#f2d37d');path(c,[[15,-37],[4,-33],[12,-29]],'#f2d37d');line(c,[[-7,-20],[0,-23],[7,-20]],'#263f33',3);
        for(let i=0;i<4;i++)ellipse(c,Math.cos(this.t+i*2)*42,-45+Math.sin(this.t+i*2)*25,2,3,'#d8ce82');
      }else{
        const s=e.type==='guardian'?1.75:1;c.scale(s,s);shadow(c,0,0,19,8,.2);
        const col=e.type==='guardian'?'#a8afa2':'#7c9589',gold=e.type==='guardian'?'#d8c18a':'#b3c19b';
        line(c,[[-9,-10],[-11,2]],'#536e68',10);line(c,[[9,-10],[11,2]],'#536e68',10);
        path(c,[[-16,-35],[-17,-12],[0,-7],[17,-12],[16,-35],[0,-41]],col,'#4d6d64',2);path(c,[[-18,-34],[-26,-30],[-22,-11],[-16,-15]],col);path(c,[[18,-34],[26,-30],[22,-11],[16,-15]],col);
        path(c,[[-9,-47],[-11,-37],[0,-31],[11,-37],[9,-47]],'#b3beb0','#5c756c',1);line(c,[[-6,-41],[6,-41]],gold,3);path(c,[[0,-29],[6,-21],[0,-14],[-6,-21]],gold);
        if(e.type==='guardian'){path(c,[[-12,-47],[-17,-57],[-6,-51],[0,-60],[6,-51],[17,-57],[12,-47]],gold);line(c,[[25,-10],[27,-56]],gold,3);path(c,[[27,-58],[21,-46],[27,-39],[34,-47]],'#e3d2a5');}
      }
      c.restore();
      const distance=Math.hypot(p.x-e.x,p.y-e.y);
      if(e.hp<e.maxHp||boss||distance<110){
        const width=boss?82:40,y=e.y-(e.type==='ancientTree'?108:boss?98:55);
        label(c,e.name||'',e.x,y-12,boss?'#f2d69d':'#e9e5c8',boss?12:10);
        c.fillStyle='#203c37';c.fillRect(e.x-width/2,y,width,4);c.fillStyle=boss?'#d0a569':'#bfbb87';c.fillRect(e.x-width/2,y,width*Math.max(0,e.hp/e.maxHp),4);
        if(gated)label(c,'境界未至 · 暂不可挑战',e.x,y+15,'#d9d3b1',10);
      }
      if(e.telegraph>0){ellipse(c,e.x,e.y,Math.max(32,e.radius||30)*1.8,Math.max(32,e.radius||30)*1.2,null,'rgba(242,148,103,.75)',2);}
    }
    node(c,n,p){
      if(n.ready===false||typeof n.ready==='number'&&n.ready>0)return;
      const herb=n.type==='herb'||n.type==='herbs';c.save();c.translate(n.x,n.y);shadow(c,0,0,10,4,.13);
      if(herb){line(c,[[0,0],[0,-16]],'#48764c',2);path(c,[[0,-4],[-12,-13],[-7,-14],[0,-9]],'#88b373');path(c,[[0,-7],[11,-17],[9,-8]],'#b1cc8c');
        for(let i=0;i<5;i++){const a=i*TAU/5;ellipse(c,Math.cos(a)*4,-20+Math.sin(a)*4,3.5,3.5,'#dbcda9');}ellipse(c,0,-20,2,2,'#efce76');
      }else{path(c,[[-8,0],[-11,-12],[-2,-30],[7,-23],[12,-4],[3,2]],'#80cfc0','#c7e9ce',1);path(c,[[-2,-30],[-1,-3],[7,-23]],'#bce6cd');path(c,[[-11,-12],[-16,-14],[-18,-2],[-8,0]],'#6aa99b');}
      const glow=.35+Math.sin(this.t*2+n.x)*.2;c.globalAlpha=glow;ellipse(c,0,-13,17,21,null,herb?'#f1e2b3':'#c1f5de');c.globalAlpha=1;
      if(Math.hypot(p.x-n.x,p.y-n.y)<90)label(c,herb?'[ E ] 采集灵草':'[ E ] 开采灵石',0,-43,'#f6edc9',11);c.restore();
    }
    drop(c,d){
      c.save();c.translate(d.x,d.y);const yy=-8+Math.sin(this.t*4+d.x)*2;const col=d.type==='herb'?'#c8d797':d.type==='potion'?'#d59686':'#e4cf94';
      const g=c.createRadialGradient(0,yy,0,0,yy,18);g.addColorStop(0,'rgba(226,216,157,.35)');g.addColorStop(1,'rgba(226,216,157,0)');ellipse(c,0,yy,18,18,g);path(c,[[0,yy-6],[5,yy],[0,yy+6],[-5,yy]],col);c.restore();
    }
    projectile(c,o){
      c.save();c.translate(o.x,o.y);c.rotate(Math.atan2(o.vy||0,o.vx||1));const enemy=o.owner==='enemy'||o.owner!=='player'&&o.owner!==undefined;
      c.shadowColor=enemy?'#deaf72':'#abeaca';c.shadowBlur=12;
      if(enemy){ellipse(c,0,0,o.radius||6,o.radius||6,'#e3bd7f');line(c,[[-16,0],[-3,0]],'rgba(246,206,142,.45)',3);}
      else{path(c,[[-15,-3],[10,0],[-15,3],[-9,0]],'#def4d6');line(c,[[-30,0],[-9,0]],'rgba(164,230,208,.6)',2);}
      c.restore();
    }
    effect(c,f){
      const alpha=Math.max(0,Math.min(1,(f.life||.1)/(f.maxLife||.5))),r=f.radius||f.r||50;
      c.save();c.translate(f.x,f.y);c.globalAlpha=alpha;
      if(f.type==='warning'){
        ellipse(c,0,0,r,r*.78,'rgba(198,88,53,.15)','rgba(244,153,107,.8)',2);ellipse(c,0,0,r*(1-alpha*.7),r*(1-alpha*.7)*.78,null,'#f1c198',1);
        for(let a=0;a<TAU;a+=TAU/8)line(c,[[Math.cos(a)*(r-5),Math.sin(a)*(r-5)*.78],[Math.cos(a)*(r+5),Math.sin(a)*(r+5)*.78]],'#edb38e',2);
      }else if(f.type==='slash'){
        c.rotate(f.angle??f.facing??0);c.strokeStyle='#e4f8ce';c.lineWidth=6*alpha;c.beginPath();c.arc(0,-8,r*.8,-.9,.9);c.stroke();c.strokeStyle='#76d6b4';c.lineWidth=2;c.beginPath();c.arc(0,-8,r,-.85,.85);c.stroke();
      }else if(f.type==='damage'||f.type==='text'){
        label(c,String(f.text??f.amount??''),0,-30-(1-alpha)*30,f.color||'#ffe3b3',f.crit?19:14);
      }else if(f.type==='heal'){
        ellipse(c,0,-14,r*alpha,r*.6*alpha,null,'#cce8aa',2);for(let i=0;i<5;i++){c.fillStyle='#d6f2c5';c.fillRect(Math.sin(i*8)*r*.7,-15-(1-alpha)*45+i*4,2,7);}
      }else if(f.type==='burst'||f.type==='ring'||f.type==='impact'){
        const rr=r*(1.2-alpha*.55);const color=f.type==='impact'?'#e4b277':'#b9efd0';ellipse(c,0,-3,rr,rr*.78,null,color,3*alpha);
        ellipse(c,0,-3,rr*.6,rr*.47,null,color,1);for(let i=0;i<12;i++){const a=i*TAU/12+this.t*.2;line(c,[[Math.cos(a)*rr*.7,Math.sin(a)*rr*.56],[Math.cos(a)*rr,Math.sin(a)*rr*.78]],color,2);}
      }else{
        const color=f.color||'#daeec5';for(let i=0;i<5;i++){const a=i*2.6;ellipse(c,Math.cos(a)*(1-alpha)*20,Math.sin(a)*(1-alpha)*20-15,2*alpha,2*alpha,color);}
      }
      c.restore();
    }
  }
  window.XianRenderer = Renderer;
})();
