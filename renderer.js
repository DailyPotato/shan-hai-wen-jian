/* Original illustrated world assets and canvas animation for 山海问剑. */
(function () {
  'use strict';
  const TAU = Math.PI * 2, W = 3200, H = 2400;
  const ELEMENT_COLORS = {metal:'#ecd496',wood:'#a4dea0',water:'#7fcdd8',fire:'#ffae79',earth:'#d6bd83',wind:'#bce9cf',thunder:'#d1adf3',ice:'#b7e6f5'};
  const THEMES = {
    red:{ground:'#856752',light:'#bd9471',dark:'#694c43',road:'#b49a72',stone:'#806357',glow:'#f3ad72'},
    snow:{ground:'#a9c1bf',light:'#e0e8d7',dark:'#719599',road:'#becdc3',stone:'#91b0ae',glow:'#b3e2ed'},
    bambooTrial:{ground:'#315e52',light:'#7b9e75',dark:'#193c3a',road:'#809582',stone:'#54766d',glow:'#bde3ad'},
    fireTrial:{ground:'#494441',light:'#7b6555',dark:'#292e32',road:'#726b60',stone:'#625f5a',glow:'#efa166'},
    iceTrial:{ground:'#638b9c',light:'#a9cbcf',dark:'#3b667b',road:'#9fbac0',stone:'#86acb7',glow:'#c4eaf5'}
  };
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
  function shadow(c, x, y, rx = 20, ry = 7, a = .2) {
    c.save();c.translate(x+5,y+3);c.scale(1,ry/rx);
    const g=c.createRadialGradient(0,0,rx*.18,0,0,rx);g.addColorStop(0,`rgba(7,25,26,${a})`);g.addColorStop(1,'rgba(7,25,26,0)');ellipse(c,0,0,rx,rx,g);c.restore();
  }
  function label(c, text, x, y, color = '#ecedd6', size = 12) {
    c.font = `${size}px "Microsoft YaHei", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 3; c.strokeStyle = 'rgba(11,29,30,.8)'; c.strokeText(text, x, y); c.fillStyle = color; c.fillText(text, x, y);
  }
  class Renderer {
    constructor(canvas) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: false });
      this.width = 1280; this.height = 720; this.camera = { x: 550, y: 1780 }; this.zoom = 1.1; this.t = 0;
      this.sprites = {};
      this.loadSprite('pine', 'assets/pine.png', 376, 480);
      this.loadSprite('cultivator', 'assets/cultivator.png', 352, 352);
      this.loadSprite('cultivatorBow', 'assets/cultivator-bow.png', 352, 352);
      this.loadSprite('cultivatorStaff', 'assets/cultivator-staff.png', 352, 352);
      this.loadSprite('sectHall', 'assets/sect-hall.png', 1240, 826);
      for(const name of ['terrain-grass','terrain-ash','terrain-snow','terrain-stone','terrain-lava','terrain-water'])this.loadSprite(name,`assets/${name}-v4.png`,1024,1024);
      for(const name of ['pavilion','alchemy-lodge','forge','bamboo','rock','wolf','golem','spirit','guardian','dragon','ancient-tree','elder','herbalist','player-sword','player-bow','player-staff','dead-tree','spirit-gate','jade-shrine','herb-garden','stone-pillar','ice-spire'])this.loadSprite(name+'V4',`assets/${name}-v4.png`);
      this.scenery = []; this.terrain = document.createElement('canvas'); this.terrain.width = W; this.terrain.height = H;
      this.mapCache=new Map();this.mapId='';this.mapMeta=null;this.transition=0;this.resize();
    }
    loadSprite(name, url, width, height) {
      const source = new Image();
      source.onload = () => {
        const cache = document.createElement('canvas'); cache.width = width || source.naturalWidth; cache.height = height || source.naturalHeight;
        const ctx = cache.getContext('2d'); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(source, 0, 0, cache.width, cache.height); this.sprites[name] = cache;
        if(name.endsWith('V4')){
          const pixels=ctx.getImageData(0,0,cache.width,cache.height).data;let x0=cache.width,y0=cache.height,x1=0,y1=0;
          for(let y=0;y<cache.height;y+=3)for(let x=0;x<cache.width;x+=3)if(pixels[(y*cache.width+x)*4+3]>24){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
          this.spriteBounds??={};if(x1>x0)this.spriteBounds[name]={x:Math.max(0,x0-4),y:Math.max(0,y0-4),w:Math.min(cache.width-x0+4,x1-x0+8),h:Math.min(cache.height-y0+4,y1-y0+8)};
        }
        if(name.startsWith('terrain-')){this.mapCache?.clear();this.mapId='';}
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
    ensureMap(state) {
      const meta = window.Xian.mapInfo ? window.Xian.mapInfo(state) : {id:'main',name:'青云山海',npcs:window.Xian.NPCS,portals:[],obstacles:window.Xian.OBSTACLES};
      const id=meta.id||state.mapId||'main';
      if(this.mapId===id)return;
      this.mapMeta=meta;this.mapId=id;this.transition=1;this.camera.x=state.player.x;this.camera.y=state.player.y;
      if(this.mapCache.has(id)){
        const cached=this.mapCache.get(id);this.terrain=cached.terrain;this.scenery=cached.scenery;
        this.mapCache.delete(id);this.mapCache.set(id,cached);return;
      }
      this.terrain=document.createElement('canvas');this.terrain.width=meta.width||W;this.terrain.height=meta.height||H;this.scenery=[];
      if(id==='main')this.makeWorld();else if(id==='sect')this.makeSect(meta);else if(['mistTown','tidePort','buriedPalace','skyRuins'].includes(id))this.makeLivingWorld(meta);else this.makeOtherWorld(meta);
      const original=['master','forge','alchemy','shrine'];
      for(const npc of meta.npcs||[])if(id!=='main'||!original.includes(npc.id)){
        const character=window.Xian.CONTENT?.NPC_CHARACTERS?.[npc.id]||window.Xian.CONTENT?.WORLD_NPCS?.[npc.id];
        this.scenery.push({type:character?'npcCharacter':npc.id==='merchant'?'merchant':npc.id==='storyteller'?'storyteller':npc.id==='waygate'?'portal':original.includes(npc.id)?npc.id:'storyteller',x:npc.x,y:npc.y,scale:1,name:npc.name,target:npc.target,npcId:npc.id,skin:npc.skin||character?.skin||npc.id,color:npc.color||character?.color,role:npc.role||character?.role});
      }
      for(const portal of meta.portals||[])this.scenery.push({...portal,type:'portal',scale:1.15});
      this.addWorldDetails(meta);
      this.mapCache.set(id,{terrain:this.terrain,scenery:this.scenery});
      // Retain at most three large terrain surfaces; every map rebuild is deterministic.
      while(this.mapCache.size>3)this.mapCache.delete(this.mapCache.keys().next().value);
    }
    material(c,name,scale=.55) {
      const image=this.sprites[name];if(!image)return null;
      const pattern=c.createPattern(image,'repeat');pattern.setTransform(new DOMMatrix().scale(scale));return pattern;
    }
    ground(c,name,color) {
      c.fillStyle=color;c.fillRect(0,0,W,H);
      const texture=this.material(c,name,.62);if(texture){c.fillStyle=texture;c.fillRect(0,0,W,H);c.fillStyle=color+'20';c.fillRect(0,0,W,H);}
    }
    road(c,points,width,color) {
      c.save();c.lineJoin='round';c.lineCap='round';line(c,points,'#193c3228',width+12);line(c,points,color,width);
      const stone=this.material(c,'terrain-stone',.16);if(stone){c.globalAlpha=.72;line(c,points,stone,width-8);}
      c.globalAlpha=.16;line(c,points,'#fff3c8',1);c.restore();
    }
    illustrated(c,name,w,h,anchor=.92) {
      const sprite=this.sprites[name];if(!sprite)return false;
      const b=this.spriteBounds?.[name]||{x:0,y:0,w:sprite.width,h:sprite.height},ratio=b.w/b.h,dw=Math.min(w,h*ratio),dh=dw/ratio;
      c.drawImage(sprite,b.x,b.y,b.w,b.h,-dw/2,-dh*anchor,dw,dh);return true;
    }
    courtyard(c,x,y,w,h,stone='#aab39b',edge='#d0d4b3') {
      c.fillStyle='#243e3526';c.fillRect(x-w/2+8,y-h/2+10,w,h);
      c.fillStyle=stone;c.fillRect(x-w/2,y-h/2,w,h);
      const paving=this.material(c,'terrain-stone',.18);
      if(paving){c.save();c.globalAlpha=.88;c.fillStyle=paving;c.fillRect(x-w/2,y-h/2,w,h);c.globalCompositeOperation='multiply';c.fillStyle=stone+'64';c.fillRect(x-w/2,y-h/2,w,h);c.restore();}
      c.strokeStyle=edge+'70';c.lineWidth=3;c.strokeRect(x-w/2+5,y-h/2+5,w-10,h-10);
      c.save();c.beginPath();c.rect(x-w/2+9,y-h/2+9,w-18,h-18);c.clip();
      for(let yy=y-h/2;yy<y+h/2;yy+=30)for(let xx=x-w/2-25;xx<x+w/2;xx+=51){
        const offset=Math.floor((yy-y+h/2)/30)%2?25:0;
        c.fillStyle=Math.floor(xx+yy)%3?'#ffffff08':'#25372c0d';c.fillRect(xx+offset+1,yy+1,49,28);
        c.strokeStyle='#263e3525';c.lineWidth=.8;c.strokeRect(xx+offset,yy,50,29);
      }c.restore();
    }
    addWorldDetails(meta) {
      if(['mistTown','tidePort','buriedPalace','skyRuins'].includes(meta.id))return;
      const rand=rng(43891+meta.id.split('').reduce((a,v)=>a+v.charCodeAt(0),0)),c=this.terrain.getContext('2d');
      const cold=['snow','iceTrial'].includes(meta.id),fire=['red','fireTrial'].includes(meta.id);
      // Small, irregular clusters form grasses and gravel, without circular terrain stamps.
      for(let i=0;i<1600;i++){
        const x=rand()*W,y=rand()*H;
        if((meta.ponds||[]).some(p=>((x-p.x)/(p.rx+8))**2+((y-p.y)/(p.ry+8))**2<1))continue;
        if(meta.type==='activity'&&x>1110&&x<2290&&y>650&&y<1750)continue;
        if(meta.id==='main'&&((x>260&&x<755&&y>1560&&y<2010)||(x>260&&x<785&&y>2020&&y<2110)))continue;
        if((meta.roads||[]).some(road=>road.slice(1).some((v,j)=>{const u=road[j],ax=u.x??u[0],ay=u.y??u[1],bx=v.x??v[0],by=v.y??v[1],t=Math.max(0,Math.min(1,((x-ax)*(bx-ax)+(y-ay)*(by-ay))/((bx-ax)**2+(by-ay)**2||1)));return Math.hypot(x-ax-t*(bx-ax),y-ay-t*(by-ay))<42;})))continue;
        if(meta.id==='sect'&&x>470&&x<2700&&y>280&&y<2110)continue;
        const color=cold?'#eef2d85c':fire?'#ad946344':i%3?'#ced89a70':'#315f406b';
        for(let j=0;j<5;j++){const xx=x+(rand()-.5)*30,yy=y+(rand()-.5)*14;
          line(c,[[xx-2,yy+3],[xx,yy-6-rand()*8],[xx+1,yy+2]],color,.9);
        }
        if(i%8===0){c.fillStyle=cold?'#c7dfe777':fire?'#e3bf7e66':'#ebe1b377';c.fillRect(x+5,y-5,2,2);c.fillRect(x+10,y-8,2,2);}
      }
      if(meta.id==='main'){
        for(const [x,y,type] of [[220,1690,'lantern'],[760,1830,'lantern'],[305,2040,'lantern'],[750,2030,'lantern'],[595,1725,'bench'],[620,2050,'bench'],[145,1880,'cart'],[850,1910,'cart'],[310,1840,'well'],[210,2040,'garden'],[725,1510,'board'],[980,1600,'sign']])this.scenery.push({type,x,y,scale:1,seed:x+y});
        for(const [x,y] of [[205,1590],[850,1750],[170,2090],[900,2050]])this.scenery.push({type:'pavilion',x,y,scale:.75,seed:x});
      }else if(meta.id!=='sect'){
        const h=meta.hub;
        for(const [dx,dy,type] of [[-255,-65,'pavilion'],[100,90,'bench'],[230,40,'cart'],[-190,125,'lantern'],[180,-145,'lantern']])this.scenery.push({type,x:h.x+dx,y:h.y+dy,scale:.85,seed:dx});
      }
      const sites=Object.values(window.Xian.CONTENT?.EXPLORATION_SITES||{}).filter(s=>s.mapId===meta.id);
      for(const s of sites)this.scenery.push({...s,type:'site',siteId:s.id,scale:1});
      if(meta.id!=='sect')for(const [i,road]of (meta.roads||[]).entries()){
        const p=road[Math.min(1,road.length-1)];if(p)this.scenery.push({type:'sign',x:(p.x??p[0])+55,y:(p.y??p[1])-38,scale:.9,seed:i});
      }
    }
    makeSect(meta) {
      const c=this.terrain.getContext('2d'),rand=rng(546371);
      this.ground(c,'terrain-grass','#607e68');
      const center=meta.hub||{x:1600,y:1200,radius:1700};
      this.courtyard(c,1600,1200,2150,1750,'#9fa998','#c9cbb2');
      for(const road of meta.roads||[]){const pts=road.map(p=>Array.isArray(p)?p:[p.x,p.y]);this.road(c,pts,85,'#c5c6af');}
      for(let i=0;i<430;i++){
        const x=70+rand()*(W-140),y=90+rand()*(H-180);
        if(x>480&&x<2720&&y>290&&y<2110)continue;
        this.scenery.push({type:rand()<.8?'pine':'bamboo',x,y,scale:1+rand()*.7,seed:i});
      }
      for(const [x,y]of [[720,480],[2500,480],[700,1980],[2510,1990]]){
        this.courtyard(c,x,y,240,170,'#718763','#a7bb86');this.scenery.push({type:'garden',x,y:y+25,scale:2.2,seed:x});
      }
      this.scenery.push({type:'sectHall',x:1600,y:710,scale:1,name:'青云大殿'});
      for(const [x,y]of [[790,1020],[2410,1020],[840,1580],[2360,1580]])this.scenery.push({type:'pavilion',x,y,scale:1.55,seed:x});
      for(const [x,y]of [[1240,820],[1950,820],[1110,1810],[2090,1810],[900,1310],[2300,1310]])this.scenery.push({type:'lantern',x,y,scale:1.3,seed:x});
      for(const [x,y]of [[1030,1450],[2170,1450],[1440,1880],[1750,1880]])this.scenery.push({type:'bench',x,y,scale:1.5,seed:x});
      for(const [x,y]of [[1210,1120],[2000,1120],[1210,1690],[2070,1690]]){
        path(c,[[x-67,y-18],[x+55,y-18],[x+67,y+20],[x-55,y+20]],'#708564','#c0c5a0',3);
        this.scenery.push({type:'garden',x,y,scale:1.25,seed:x});
        for(const dx of [-70,70])this.scenery.push({type:'lantern',x:x+dx,y:y+29,scale:.85,seed:dx});
      }
      for(const [x,y]of [[1470,1400],[1730,1400],[1460,1690],[1730,1690]])this.scenery.push({type:'bench',x,y,scale:1.1,seed:x});
      for(const [x,y]of [[1050,610],[2250,1820]]){
        this.scenery.push({type:'rock',x,y,scale:1.5,seed:x});this.scenery.push({type:'pine',x:x+36,y:y-20,scale:1.35,seed:x});
      }
      for(const [x,y]of [[1380,1020],[1820,1020],[1320,1430],[1910,1430],[1320,1800],[1960,1800]]){
        this.courtyard(c,x,y,145,86,'#6f8664','#b5bf98');
        this.scenery.push({type:'rock',x:x-23,y:y+4,scale:.7,seed:x});this.scenery.push({type:'pine',x:x+18,y:y-8,scale:.88,seed:x});
      }
      this.scenery.push({type:'gate',x:1600,y:2090,scale:2.2});
      for(const side of [-1,1])for(let j=0;j<11;j++)this.scenery.push({type:'wall',x:1600+side*(180+j*77),y:2090,scale:1,seed:j});
      for(const o of meta.obstacles||[])this.scenery.push({type:'rock',x:o.x,y:o.y+o.radius*.3,scale:o.radius/22,seed:0});
    }
    makeLivingWorld(meta){
      const c=this.terrain.getContext('2d'),town=meta.id==='mistTown',harbor=meta.id==='tidePort',crypt=meta.id==='buriedPalace',sky=meta.id==='skyRuins';
      const rand=rng(town?88327:harbor?73117:crypt?44921:99931),hub=meta.hub||{x:550,y:1780,radius:290};
      const palette=town?['#777e72','#aaa48b','#454f4b']:harbor?['#668986','#b5b296','#3a6469']:crypt?['#56595b','#99927e','#2d3740']:['#92a8a5','#d0d4bd','#637f84'];
      this.ground(c,crypt?'terrain-ash':'terrain-stone',palette[0]);
      c.fillStyle=palette[0]+'a0';c.fillRect(0,0,W,H);
      if(harbor){c.fillStyle='#929b87';c.fillRect(0,0,W,H);for(let i=0;i<11000;i++){c.fillStyle=i%3?'#d6ceb12c':'#596f662c';c.fillRect(rand()*W,rand()*H,rand()*4+1,rand()*2+1);}}
      // Fixed paving joints make these inhabited / constructed places distinct from wilderness.
      for(let yy=0;yy<H;yy+=crypt?90:62)for(let xx=0;xx<W;xx+=crypt?140:104){
        const x=xx+(Math.floor(yy/(crypt?90:62))%2)*45,y=yy;
        c.strokeStyle=palette[2]+(harbor?'09':'40');c.lineWidth=1;c.strokeRect(x+2,y+2,crypt?135:99,crypt?85:57);
        c.fillStyle=rand()<.3?palette[1]+'15':palette[2]+'0b';c.fillRect(x+3,y+3,crypt?133:97,crypt?83:55);
        if(rand()<.065)line(c,[[x+15,y+3],[x+39,y+24],[x+35,y+40],[x+62,y+50]],palette[2]+'65',1);
      }
      if(crypt){
        // Distinct burial chambers and recessed wall courses, with open aisles between them.
        for(const [x,y,w,h] of [[1600,550,1160,560],[2500,1220,910,680],[1470,1830,760,500],[470,1780,680,610]]){
          this.courtyard(c,x,y,w,h,'#69716b','#afa68a');
          c.strokeStyle='#202f38a0';c.lineWidth=15;c.strokeRect(x-w/2-12,y-h/2-12,w+24,h+24);c.strokeStyle='#8f998655';c.lineWidth=3;c.strokeRect(x-w/2-23,y-h/2-23,w+46,h+46);
          for(const side of [-1,1])this.scenery.push({type:'cryptBrazier',x:x+side*(w/2-35),y:y-h/2+30,scale:1.25});
          path(c,[[x-60,y],[x,y-44],[x+60,y],[x,y+44]],null,'#a5a28c42',3);
        }
      }
      if(sky)for(const [x,y]of [[1470,740],[2460,600],[2500,1300],[1760,2030],[660,1550]]){
        this.courtyard(c,x,y,600,370,'#b2c0b6','#e0d9ae');
        path(c,[[x-100,y],[x,y-72],[x+100,y],[x,y+72]],null,'#b9a77688',3);path(c,[[x-76,y],[x,y-53],[x+76,y],[x,y+53]],null,'#e4e5c485',2);
        for(const side of [-1,1])line(c,[[x+side*230,y-135],[x+side*230,y+135]],'#78989955',3);
      }
      const roads=(meta.roads||[]).map(r=>r.map(p=>Array.isArray(p)?p:[p.x,p.y]));
      if(!roads.length)roads.push([[hub.x,hub.y],[1200,1500],[2100,1000],[2820,600]],[[1200,1500],[2100,1900],[2900,1700]]);
      if(sky){
        const rim=110;c.fillStyle='#506f7d';c.fillRect(0,0,W,rim);c.fillRect(0,H-rim,W,rim);c.fillRect(0,0,rim,H);c.fillRect(W-rim,0,rim,H);
        for(let i=0;i<95;i++){const edge=i%4,x=edge<2?(edge?W:0)+rand()*90-45:rand()*W,y=edge>=2?(edge===3?H:0)+rand()*90-45:rand()*H;const fog=c.createRadialGradient(x,y,0,x,y,100+rand()*140);fog.addColorStop(0,'#e3e9d775');fog.addColorStop(1,'#c5ddd700');c.fillStyle=fog;c.fillRect(x-240,y-240,480,480);}
        c.strokeStyle='#e0dec17a';c.lineWidth=4;c.strokeRect(132,132,W-264,H-264);
        for(const pts of roads){this.road(c,pts,158,'#c2c7b0');line(c,pts,'#f1ebc47a',2);}
      }else for(const pts of roads)this.road(c,pts,harbor?126:crypt?104:100,palette[1]);
      if(harbor){
        // Timber promenade on the same traversable roads used by the engine.
        for(const pts of roads){c.save();c.lineCap='butt';line(c,pts,'#8e856d',91);c.setLineDash([3,15]);line(c,pts,'#bdb397',84);c.restore();}
      }
      this.courtyard(c,hub.x,hub.y,640,460,crypt?'#77766b':palette[1],crypt?'#b8a47a':'#dcdbb8');
      if(harbor){c.fillStyle='#938970';c.fillRect(hub.x-320,hub.y-230,640,460);for(let x=hub.x-320;x<hub.x+320;x+=20){line(c,[[x,hub.y-228],[x,hub.y+228]],'#d3c3a299',1);line(c,[[x+2,hub.y-228],[x+2,hub.y+228]],'#4c655b55',1);}for(const yy of [-185,-35,115])for(let xx=-290;xx<310;xx+=40){ellipse(c,hub.x+xx,hub.y+yy,1.2,1.2,'#526356');}}
      const avoid=(x,y,r=100)=>{
        if((meta.npcs||[]).some(n=>Math.hypot(x-n.x,y-n.y)<r+85))return true;
        if((meta.spawns||[]).some(s=>Math.hypot(x-s[1],y-s[2])<r+80))return true;
        if((meta.nodes||[]).some(n=>Math.hypot(x-(n.x??n[1]),y-(n.y??n[2]))<r+45))return true;
        if((meta.portals||[]).some(n=>Math.hypot(x-n.x,y-n.y)<r+80))return true;
        if((meta.ponds||[]).some(p=>((x-p.x)/(p.rx+r))**2+((y-p.y)/(p.ry+r))**2<1))return true;
        return roads.some(pts=>pts.slice(1).some((b,i)=>{const a=pts[i],dx=b[0]-a[0],dy=b[1]-a[1],u=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a[0]-u*dx,y-a[1]-u*dy)<r+70;}));
      };
      for(const pond of meta.ponds||[]){
        if(crypt){this.water(c,pond.x,pond.y,pond.rx,pond.ry);c.save();c.globalAlpha=.25;ellipse(c,pond.x,pond.y,pond.rx,pond.ry,'#727357');c.restore();}
        else if(sky){ellipse(c,pond.x,pond.y,pond.rx+13,pond.ry+13,'#c7cbb7','#e4dfb4',4);ellipse(c,pond.x,pond.y,pond.rx,pond.ry,'#476c7e');for(let i=0;i<12;i++){const x=pond.x+(rand()-.5)*pond.rx*1.5,y=pond.y+(rand()-.5)*pond.ry*1.3;ellipse(c,x,y,30+rand()*60,12+rand()*18,'#d4e4dc38');}}
        else{this.water(c,pond.x,pond.y,pond.rx,pond.ry);if(harbor){this.scenery.push({type:'junkBoat',x:pond.x,y:pond.y+15,scale:1.5});for(let i=0;i<5;i++)this.scenery.push({type:'mooring',x:pond.x-pond.rx-20,y:pond.y-pond.ry*.7+i*pond.ry*.35,scale:1});}}
      }
      for(let y=340;y<2220;y+=town?285:320)for(let x=260;x<3030;x+=town?330:380){
        const xx=x+(rand()-.5)*55,yy=y+(rand()-.5)*55;if(avoid(xx,yy,town?100:70)||Math.hypot(xx-hub.x,yy-hub.y)<(town?225:hub.radius+70))continue;
        const type=town?'townHouse':harbor?(rand()<.45?'warehouse':'cargo'):crypt?(rand()<.6?'sarcophagus':'cryptPillar'):(rand()<.65?'cloudArch':'starArmillary');
        this.scenery.push({type,x:xx,y:yy,scale:town?1.55:.95+rand()*.4,seed:Math.floor(rand()*6)});
        if(town){this.scenery.push({type:'lantern',x:xx+130,y:yy+25,scale:1.25});if(rand()<.6)this.scenery.push({type:'planter',x:xx-128,y:yy+12,scale:1.1,seed:Math.floor(rand()*6)});}
      }
      for(let i=0;i<75;i++){
        const x=190+rand()*2820,y=200+rand()*2000;if(avoid(x,y,38))continue;
        this.scenery.push({type:town?(i%3?'planter':'bench'):harbor?(i%3?'fishingNet':'cargo'):crypt?(i%4?'brokenPot':'cryptBrazier'):(i%4?'stoneShard':'lantern'),x,y,scale:.65+rand()*.4,seed:i});
      }
      const props=town?['marketStall','board','lantern','marketStall']:harbor?['cargo','mooring','lantern','cargo']:crypt?['cryptBrazier','stoneDesk','cryptBrazier','sarcophagus']:['starArmillary','stoneDesk','cloudArch','lantern'];
      [[-260,-180],[230,-160],[-240,200],[260,210]].forEach(([dx,dy],i)=>{const x=hub.x+dx,y=hub.y+dy;if(!(meta.npcs||[]).some(n=>Math.hypot(x-n.x,y-n.y)<95))this.scenery.push({type:props[i],x,y,scale:1.2,seed:i});});
      for(const o of meta.obstacles||[])this.scenery.push({type:town?'cargo':harbor?'cargo':crypt?'sarcophagus':'starArmillary',x:o.x,y:o.y,scale:Math.max(.8,o.radius/34),solid:true});
      const districts=town?['清平坊 · 行旅集市','封锁旧街 · 妖物出没']:harbor?['归潮栈桥 · 渔舟港','海妖浅滩 · 谨慎通行']:crypt?['长明前殿 · 探墓营地','沉沙内宫 · 机关残骸']:['问星云台 · 观测庭','断空遗址 · 风暴核心'];
      label(c,districts[0],hub.x,hub.y+210,'#eee0b3',18);label(c,districts[1],2360,410,crypt?'#c6b492':'#d8e2ca',20);
      for(const site of Object.values(window.Xian.CONTENT?.EXPLORATION_SITES||{}).filter(v=>v.mapId===meta.id))this.scenery.push({...site,type:'site',siteId:site.id,scale:1});
    }
    livingScenery(c,o){
      const seed=o.seed||0,near=this.currentPlayer&&this.currentPlayer.y<o.y&&this.currentPlayer.y>o.y-190&&Math.abs(this.currentPlayer.x-o.x)<105*(o.scale||1);
      if(near&&['townHouse','warehouse','cloudArch','junkBoat'].includes(o.type))c.globalAlpha=.38;
      shadow(c,0,0,o.type==='townHouse'?100:55,16,.2);
      if(o.type==='townHouse'||o.type==='warehouse'){
        this.building(c,o.type==='townHouse'?175:165,110,['#536f73','#796863','#677b65'][seed%3],false,o.type==='warehouse'?'船货行':['听雨居','云来客栈','百味斋'][seed%3]);
        if(o.type==='townHouse'){for(const x of [-55,55]){c.fillStyle='#ddd0a4';c.fillRect(x-15,-66,30,35);for(let i=0;i<4;i++)line(c,[[x-13+i*8,-65],[x-13+i*8,-32]],'#667969',2);line(c,[[x-15,-49],[x+15,-49]],'#667969',2);}}
      }else if(o.type==='marketStall'){
        for(const x of [-44,44])line(c,[[x,0],[x,-93]],'#685d44',4);
        path(c,[[-53,-70],[-39,-98],[39,-98],[53,-70]],seed%2?'#718d84':'#a77768','#d8c8a1',2);
        for(let i=0;i<6;i++)line(c,[[-40+i*15,-95],[-49+i*19,-71]],'#ead6ad66',4);
        path(c,[[-47,-33],[45,-33],[48,-10],[-49,-10]],'#96784f','#c8b17e',2);
        for(let i=0;i<6;i++){ellipse(c,-35+i*14,-37,7,8,['#91b8aa','#c0a27a','#d2caa5'][i%3]);line(c,[[-35+i*14,-40],[-35+i*14,-44]],'#dcd7ad',2);}
      }else if(o.type==='cargo'){
        for(const [x,y,s] of [[-22,0,1],[20,-5,.8],[-9,-31,.85]]){c.save();c.translate(x,y);c.scale(s,s);path(c,[[-24,0],[-24,-34],[13,-34],[26,-23],[26,0]],'#907650','#d0b98a',1);path(c,[[-24,-34],[-10,-43],[26,-23],[13,-17]],'#b49a70','#d0b98a',1);for(const xx of [-16,9])line(c,[[xx,-28],[xx,-1]],'#534f3e',3);line(c,[[-21,-18],[19,-18]],'#685b43',2);c.restore();}
      }else if(o.type==='mooring'){
        ellipse(c,0,-2,15,6,'#6d6c54');path(c,[[-10,0],[-10,-32],[10,-32],[10,0]],'#8a7c59','#c2b38a',1);ellipse(c,0,-32,10,5,'#b2a079','#d0c3a0',1);for(let i=0;i<4;i++)ellipse(c,1,-9-i*4,15,5,null,'#c3b58b',2);
      }else if(o.type==='junkBoat'){
        path(c,[[-87,-9],[-67,14],[47,20],[88,-13],[44,-5],[-32,-4]],'#735b41','#c1a276',2);path(c,[[-68,-9],[-35,-37],[56,-31],[72,-12]],'#ac9471','#cbbc93',1.5);
        line(c,[[5,0],[5,-150]],'#705d44',4);path(c,[[1,-146],[-55,-127],[-61,-81],[-43,-47],[1,-43]],'#c8c09d','#efddb3',1);for(let i=0;i<5;i++)line(c,[[0,-138+i*20],[-51,-126+i*17]],'#877957',1.7);
        path(c,[[11,-132],[49,-118],[55,-71],[13,-52]],'#a8bcb0','#e1dcc0',1);for(let i=0;i<4;i++)line(c,[[12,-124+i*20],[48,-114+i*15]],'#667e74',1.5);
      }else if(o.type==='sarcophagus'){
        path(c,[[-28,-2],[-30,-62],[-13,-85],[25,-79],[35,-59],[31,-2]],'#687276','#b3ad98',2);path(c,[[-30,-62],[-13,-85],[25,-79],[35,-59],[21,-49],[-13,-51]],'#9b9d8c','#c7c0a7',1);
        line(c,[[0,-62],[0,-12]],'#c1ad75',2);path(c,[[0,-48],[-11,-36],[0,-26],[11,-36]],null,'#d0bd86',2);line(c,[[-18,-5],[21,-5]],'#343f45',3);
      }else if(o.type==='cryptPillar'){
        path(c,[[-27,3],[-23,-113],[-12,-126],[19,-119],[27,2]],'#647175','#aaa791',2);path(c,[[3,-118],[19,-119],[27,2],[5,1]],'#8a9590');
        for(let i=0;i<5;i++)line(c,[[-12,-100+i*17],[-3,-105+i*17],[9,-95+i*17]],'#b4b69d77',2);path(c,[[-14,-121],[-10,-144],[3,-139],[8,-125]],'#a0a58e','#c4b99b',1);
      }else if(o.type==='cryptBrazier'){
        path(c,[[-18,1],[-12,-30],[12,-30],[18,1]],'#69757a','#b8ad8c',2);path(c,[[-23,-34],[-16,-20],[16,-20],[23,-34]],'#a29b7e','#d4c394',2);
        const flicker=Math.sin(this.t*6)*4;path(c,[[-12,-34],[-14,-44],[-4,-66+flicker],[1,-46],[11,-59],[14,-39],[7,-32]],'#97c6bb','#def0cd',1);ellipse(c,0,-44,30,33,'#adc9ab15');
      }else if(o.type==='cloudArch'){
        for(const side of [-1,1]){const x=side*49;path(c,[[x-12,3],[x-9,-117],[x+9,-117],[x+12,3]],'#a4b2b0','#e6dfb9',1.5);line(c,[[x,-103],[x,-8]],'#677f8b',2);path(c,[[x-16,-119],[x,-139],[x+16,-119]],'#c8cec0','#e3d3a1',1);}
        path(c,[[-74,-116],[-49,-137],[0,-144],[49,-137],[74,-116],[43,-123],[0,-131],[-43,-123]],'#718c94','#d5d7b8',2);
        for(let i=0;i<3;i++)path(c,[[0,-156-i*15],[-5,-149-i*15],[0,-142-i*15],[5,-149-i*15]],'#d9c78e','#f0e5bc',1);
      }else if(o.type==='starArmillary'){
        path(c,[[-28,3],[-21,-12],[21,-12],[28,3]],'#879d9b','#d1ccb0',2);line(c,[[0,-8],[0,-35]],'#b4a679',8);
        c.save();c.translate(0,-62);c.rotate(.3);ellipse(c,0,0,34,34,null,'#c6b07a',3);ellipse(c,0,0,14,35,null,'#e6d4a0',2);c.rotate(-.7);ellipse(c,0,0,38,13,null,'#a5c2bd',3);ellipse(c,0,0,10,10,'#91bdb7','#e6e5bc',1);c.restore();
      }else if(o.type==='planter'){
        path(c,[[-14,0],[-18,-21],[18,-21],[14,0]],'#8b7660','#c7b18b',1);ellipse(c,0,-22,19,7,'#5f735c','#b7b891',1);
        for(let i=0;i<7;i++){const x=Math.sin(i*2.4)*16,y=-33-Math.cos(i*1.7)*14;line(c,[[0,-22],[x,y]],'#5b7753',2);ellipse(c,x,y,10,6,['#869b72','#a9b481','#749480'][i%3]);if(seed%2)ellipse(c,x+3,y-3,3,3,'#dec5a5');}
      }else if(o.type==='fishingNet'){
        path(c,[[-32,-6],[-22,-44],[26,-38],[36,0]],'#80978b44','#a9b5a0',1);for(let i=0;i<7;i++){line(c,[[-25+i*8,-39],[-31+i*11,-3]],'#c2c4a47a',.7);line(c,[[-28,-7-i*5],[33,-2-i*5]],'#c2c4a47a',.7);}ellipse(c,27,-9,13,5,null,'#bead87',3);line(c,[[-33,0],[-24,-48]],'#777759',3);
      }else if(o.type==='brokenPot'){
        path(c,[[-13,0],[-19,-15],[-13,-26],[-5,-20],[3,-27],[12,-19],[17,-13],[11,0]],'#7c8479','#a5ad93',1);ellipse(c,0,-23,11,4,'#3d4e4c');path(c,[[22,1],[25,-8],[34,-3]],'#8e9581','#b3b397',1);
      }else if(o.type==='stoneShard'){
        path(c,[[-20,0],[-15,-18],[-3,-10],[7,-26],[20,-16],[18,1]],'#94aaa7','#d0d7bc',1);line(c,[[-10,-7],[5,-8],[11,-17]],'#b5ba93',1.5);
      }else if(o.type==='stoneDesk'){
        for(const x of [-29,29])line(c,[[x,-18],[x,3]],'#71888a',8);path(c,[[-43,-24],[-31,-38],[35,-38],[46,-24],[39,-16],[-36,-16]],'#a8b8aa','#d6d1b0',1);path(c,[[-20,-29],[-14,-37],[18,-35],[15,-25]],'#e6d8b5','#adad8d',.7);line(c,[[-9,-30],[9,-29]],'#8b9a87',1);
      }
    }
    makeOtherWorld(meta) {
      const c=this.terrain.getContext('2d'),sourceId=meta.sourceMapId||meta.id,theme=THEMES[sourceId]||THEMES.bambooTrial;
      let seed=93271;for(const ch of meta.id)seed=(seed*31+ch.charCodeAt(0))>>>0;const rand=rng(seed);
      const isSnow=['snow','iceTrial'].includes(sourceId),isFire=['red','fireTrial'].includes(sourceId),isTrial=meta.type==='trial'||/Trial/.test(sourceId);
      this.ground(c,isSnow?'terrain-snow':isFire?'terrain-ash':isTrial?'terrain-stone':'terrain-grass',theme.ground);
      for(let i=0;i<130;i++){
        const x=rand()*W,y=rand()*H,r=80+rand()*190,g=c.createRadialGradient(x,y,0,x,y,r);
        g.addColorStop(0,i%2?theme.light+'35':theme.dark+'4a');g.addColorStop(1,theme.ground+'00');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
      }
      if(isTrial){
        // Raised stone halls have distinct joints, engraved borders and three battle courtyards.
        for(let y=160;y<H;y+=62)for(let x=130;x<W;x+=94){
          const xx=x+(Math.floor(y/62)%2)*47;c.strokeStyle=theme.light+'25';c.lineWidth=1;
          c.strokeRect(xx+2,y+2,89,57);if(rand()<.08)line(c,[[xx+8,y+9],[xx+28,y+28],[xx+40,y+30],[xx+70,y+49]],theme.dark+'99',1);
        }
      }else{
        for(let i=0;i<5000;i++){
          const x=rand()*W,y=rand()*H;c.fillStyle=i%2?theme.light+'35':theme.dark+'38';c.fillRect(x,y,rand()*5+1,rand()*2+1);
          if(isSnow&&i%15===0)ellipse(c,x,y,5+rand()*12,2+rand()*4,'rgba(238,244,228,.2)');
        }
      }
      const roads=meta.roads?.length?meta.roads:[[{x:550,y:1780},{x:1040,y:1450},{x:1750,y:1150},{x:2530,y:760}],[{x:1040,y:1450},{x:2200,y:1860},{x:2850,y:1640}]];
      for(const road of roads){
        const pts=road.map(p=>Array.isArray(p)?p:[p.x,p.y]);this.road(c,pts,78,theme.road);
      }
      for(const pond of meta.ponds||[]){
        if(isFire){
          const shore=[];for(let i=0;i<56;i++){const a=i*TAU/56,k=1+Math.sin(i*3.7)*.028;shore.push([pond.x+Math.cos(a)*(pond.rx+14)*k,pond.y+Math.sin(a)*(pond.ry+12)*k]);}path(c,shore,'#302b29','#82513b',3);
          const g=c.createLinearGradient(pond.x,pond.y-pond.ry,pond.x,pond.y+pond.ry);g.addColorStop(0,'#a34b37');g.addColorStop(.55,'#ce794b');g.addColorStop(1,'#e8ab67');ellipse(c,pond.x,pond.y,pond.rx,pond.ry,g);
          c.save();c.beginPath();c.ellipse(pond.x,pond.y,pond.rx,pond.ry,0,0,TAU);c.clip();
          for(let i=0;i<100;i++){const x=pond.x+(rand()-.5)*pond.rx*2,y=pond.y+(rand()-.5)*pond.ry*2,s=12+rand()*34;path(c,[[x-s,y],[x-s*.3,y-s*.7],[x+s*.8,y-s*.4],[x+s,y+s*.35],[x-s*.2,y+s*.6]],'#4e342ec9','#fdc17a66',1);line(c,[[x-s,y+4],[x,y+s*.7],[x+s,y+s*.35]],'#ffc98277',1.2);}
          for(let i=0;i<16;i++){const x=pond.x+(rand()-.5)*pond.rx*1.7,y=pond.y+(rand()-.5)*pond.ry*1.7;c.beginPath();c.moveTo(x-28,y);c.bezierCurveTo(x-10,y-9,x+18,y+11,x+45,y-3);c.strokeStyle='#ffe19c88';c.lineWidth=1.6;c.stroke();}c.restore();
          if(this.sprites['terrain-lava']){c.save();c.beginPath();c.ellipse(pond.x,pond.y,pond.rx,pond.ry,0,0,TAU);c.clip();c.fillStyle=this.material(c,'terrain-lava',.45);c.fillRect(pond.x-pond.rx,pond.y-pond.ry,pond.rx*2,pond.ry*2);c.restore();}
          for(let i=0;i<38;i++){const a=i*2.399,x=pond.x+Math.cos(a)*(pond.rx+9),y=pond.y+Math.sin(a)*(pond.ry+7),s=7+i%11;path(c,[[x-s,y],[x-s*.2,y-s],[x+s,y-s*.4],[x+s*.7,y+s*.4]],'#4a3930','#ac735333',1);}
        }else if(isSnow){
          const shore=[];for(let i=0;i<54;i++){const a=i*TAU/54,k=1+Math.sin(i*2.7)*.025;shore.push([pond.x+Math.cos(a)*(pond.rx+12)*k,pond.y+Math.sin(a)*(pond.ry+10)*k]);}path(c,shore,'#e5ece7','#a5c6c8',2);
          const ice=c.createLinearGradient(pond.x,pond.y-pond.ry,pond.x,pond.y+pond.ry);ice.addColorStop(0,'#6c969f');ice.addColorStop(.5,'#9fc3c9');ice.addColorStop(1,'#d0e2df');ellipse(c,pond.x,pond.y,pond.rx,pond.ry,ice,'#bcd6d0',2);
          c.save();c.beginPath();c.ellipse(pond.x,pond.y,pond.rx,pond.ry,0,0,TAU);c.clip();
          for(let i=0;i<23;i++){const a=i*2.399,x=pond.x+Math.cos(a)*pond.rx*.75,y=pond.y+Math.sin(a)*pond.ry*.65;line(c,[[x-40,y-10],[x-15,y+4],[x,y],[x+27,y+15],[x+47,y+13]],'#e5f4ef77',.8);line(c,[[x,y],[x+4,y-18],[x+17,y-32]],'#477d901e',1.4);}
          for(let i=0;i<700;i++){c.fillStyle=i%2?'#edf5ee33':'#2451650b';c.fillRect(pond.x+(rand()-.5)*pond.rx*2,pond.y+(rand()-.5)*pond.ry*2,1+rand()*3,1);}c.restore();
          if(this.sprites['terrain-water']){c.save();c.beginPath();c.ellipse(pond.x,pond.y,pond.rx,pond.ry,0,0,TAU);c.clip();c.globalAlpha=.32;c.fillStyle=this.material(c,'terrain-water',.35);c.fillRect(pond.x-pond.rx,pond.y-pond.ry,pond.rx*2,pond.ry*2);c.globalCompositeOperation='screen';c.globalAlpha=.3;c.fillStyle=this.material(c,'terrain-snow',.24);c.fillRect(pond.x-pond.rx,pond.y-pond.ry,pond.rx*2,pond.ry*2);c.restore();}
          for(let i=0;i<32;i++){const a=i*2.399,x=pond.x+Math.cos(a)*(pond.rx+8),y=pond.y+Math.sin(a)*(pond.ry+6),s=4+i%8;path(c,[[x-s,y],[x-s*.3,y-s*.7],[x+s*.6,y-s*.4],[x+s,y+2]],'#d9e5e0','#91aeb144',.8);}
        }else this.water(c,pond.x,pond.y,pond.rx,pond.ry);
      }
      if(meta.type==='activity'){
        this.courtyard(c,1700,1200,1060,840,theme.stone,theme.light);
        const arena=meta.arena||{x:1700,y:1200,radius:500};
        c.save();c.strokeStyle=theme.glow+'aa';c.lineWidth=4;c.setLineDash([20,12]);c.beginPath();c.arc(arena.x,arena.y,arena.radius,0,TAU);c.stroke();c.restore();
        for(let i=0;i<4;i++){const a=i*TAU/4,x=arena.x+Math.cos(a)*arena.radius,y=arena.y+Math.sin(a)*arena.radius;this.scenery.push({type:'pillar',x,y,scale:1.2,seed:i});label(c,'历练边界',x,y+29,theme.light,12);}
      }
      const hub=meta.hub||{x:500,y:1800,radius:250};
      if(hub.radius>0)this.courtyard(c,hub.x,hub.y,420,300,theme.road,theme.light);
      const trialGroups=isTrial?[1,2,3].map(wave=>{const s=(meta.spawns||[]).filter(v=>v[3]===wave);return s.length?{x:s.reduce((n,v)=>n+v[1],0)/s.length,y:s.reduce((n,v)=>n+v[2],0)/s.length}:null;}).filter(Boolean):[];
      const arenas=meta.arenas||trialGroups;
      for(let i=0;i<arenas.length;i++){
        const a=arenas[i],x=a.x||a[0],y=a.y||a[1],r=a.radius||140;
        this.courtyard(c,x,y,r*2.1,r*1.55,theme.stone,theme.light);
        c.fillStyle=theme.glow+'55';c.font='42px SimSun,serif';c.textAlign='center';c.fillText(['壹','贰','叁'][i]||'试',x,y+15);
      }
      const nearRoute=(x,y)=>roads.some(road=>road.slice(1).some((end,i)=>{const start=road[i],ax=start.x??start[0],ay=start.y??start[1],bx=end.x??end[0],by=end.y??end[1],t=Math.max(0,Math.min(1,((x-ax)*(bx-ax)+(y-ay)*(by-ay))/((bx-ax)**2+(by-ay)**2||1)));return Math.hypot(x-ax-t*(bx-ax),y-ay-t*(by-ay))<125;}));
      for(let i=0;i<(isTrial?230:340);i++){
        const x=75+rand()*(W-150),y=90+rand()*(H-180);
        if(meta.type==='activity'&&x>1110&&x<2290&&y>730&&y<1670)continue;
        if(Math.hypot(x-hub.x,y-hub.y)<hub.radius+65||nearRoute(x,y)||(meta.ponds||[]).some(p=>((x-p.x)/(p.rx+70))**2+((y-p.y)/(p.ry+65))**2<1))continue;
        if(arenas.some(a=>Math.hypot(x-(a.x??a[0]),y-(a.y??a[1]))<(a.radius||140)+95)||(meta.spawns||[]).some(spawn=>Math.hypot(x-spawn[1],y-spawn[2])<125))continue;
        let type=isSnow?(isTrial&&rand()<.48?'iceSpire':'snowPine'):isFire?'deadTree':'bamboo';
        if(rand()<.22)type='rock';this.scenery.push({type,x,y,scale:.65+rand()*.8,seed:rand()*1000});
      }
      for(const o of meta.obstacles||[])this.scenery.push({type:isSnow?'iceRock':'rock',x:o.x,y:o.y+o.radius*.3,scale:o.radius/22,seed:0});
      if(isTrial){for(const a of arenas){const x=a.x??a[0],y=a.y??a[1];for(const side of [-1,1])this.scenery.push({type:isSnow?'iceSpire':'pillar',x:x+side*180,y:y-100,scale:1.6,seed:0});}}
      else this.scenery.push({type:'ruinGate',x:650,y:1650,scale:1.1,seed:0});
    }
    makeWorld() {
      const c = this.terrain.getContext('2d'), rand = rng(861239);
      this.ground(c,'terrain-grass','#688b70');
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
      road('rgba(43,79,59,.13)', 102); road(this.material(c,'terrain-stone',.16)||'#a8ad85', 81); road('rgba(210,208,162,.11)', 54);
      c.beginPath(); c.moveTo(1070,1640); c.bezierCurveTo(1170,1800,1850,1830,2430,1590); c.strokeStyle=this.material(c,'terrain-stone',.16)||'#a0a386'; c.lineWidth=55; c.stroke();
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
      this.courtyard(c,505,1810,480,370,'#adb598','#d4d1b0');
      this.road(c,[[280,1970],[280,2080],[755,2080],[755,1970]],44,'#b3b69a');
      this.road(c,[[300,1570],[300,1620],[735,1620]],36,'#adb598');
      // Boss landmarks use broken paving and clear scenery rather than unexplained floor rings.
      [[1450,1580,210,'#a8ad91'],[2020,650,235,'#759a80'],[2790,650,295,'#a2ab9d']].forEach(([x,y,w,col])=>this.courtyard(c,x,y,w,w*.65,col,'#d3d1b2'));
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
      [{type:'gate',x:890,y:1510,scale:1},{type:'temple',x:430,y:1600,scale:1},
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
      const shore=[];for(let i=0;i<48;i++){const a=i*TAU/48,k=1+Math.sin(i*2.8)*.024;shore.push([x+Math.cos(a)*(rx+14)*k,y+Math.sin(a)*(ry+11)*k]);}
      path(c,shore,'#667d60','#a8b48f',3);
      const g=c.createLinearGradient(x,y-ry,x,y+ry);g.addColorStop(0,'#2d6767');g.addColorStop(.6,'#4e9690');g.addColorStop(1,'#88b6a3');ellipse(c,x,y,rx,ry,g);
      if(this.sprites['terrain-water']){c.save();c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.clip();c.globalAlpha=.68;c.fillStyle=this.material(c,'terrain-water',.35);c.fillRect(x-rx,y-ry,rx*2,ry*2);c.restore();}
      for(let i=0;i<28;i++){const yy=y-ry+10+i*ry*2/28,xx=rx*Math.sqrt(Math.max(0,1-((yy-y)/ry)**2));line(c,[[x-xx*.83,yy],[x+xx*.68,yy]],'rgba(177,220,192,.13)',1);}
      for(let i=0;i<7;i++){const xx=x+Math.cos(i*1.9)*rx*.75,yy=y+Math.sin(i*1.9)*ry*.64;ellipse(c,xx,yy,9,4,'#80a16c');ellipse(c,xx+1,yy-2,2.5,2,'#efcaba');}
      for(let i=0;i<30;i++){const a=i*2.399,xx=x+Math.cos(a)*(rx+9),yy=y+Math.sin(a)*(ry+6),r=3+i%6;
        path(c,[[xx-r,yy],[xx-r*.4,yy-r*.7],[xx+r*.5,yy-r*.6],[xx+r,yy+1],[xx,yy+r*.3]],i%2?'#adba9a':'#809779','#506e5b66',.5);
        if(i%3===0){line(c,[[xx+5,yy+2],[xx+6,yy-14],[xx+9,yy-21]],'#66855a',1.2);line(c,[[xx+2,yy+1],[xx+1,yy-11],[xx-2,yy-16]],'#94b082',1);}
      }
    }
    draw(state, dt=0.016){
      this.ensureMap(state);
      const c=this.ctx; this.t += Math.min(dt,.1); const p=state.player; this.currentPlayer = p;this.currentState=state;
      const follow=dt>0?Math.min(1,dt*14):1;this.camera.x+=(p.x-this.camera.x)*follow;this.camera.y+=(p.y-this.camera.y)*follow;
      // Clamp the viewport to the world edge where possible.
      const hw=this.width/(2*this.zoom),hh=this.height/(2*this.zoom);
      this.camera.x=hw<W/2?Math.max(hw,Math.min(W-hw,this.camera.x)):W/2;
      this.camera.y=hh<H/2?Math.max(hh,Math.min(H-hh,this.camera.y)):H/2;
      c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle='#32564c';c.fillRect(0,0,this.width,this.height);
      c.translate(this.width/2,this.height/2);c.scale(this.zoom,this.zoom);c.translate(-this.camera.x,-this.camera.y);
      c.drawImage(this.terrain,0,0);
      if(!['red','fireTrial'].includes(this.mapMeta?.sourceMapId||this.mapId))for(const pond of this.mapMeta?.ponds||[]){
        c.save();c.globalAlpha=.14;c.strokeStyle='#ecf6d6';c.lineWidth=1.5;
        for(let i=0;i<8;i++){const yy=pond.y+Math.sin(i*1.7+this.t*.3)*pond.ry*.76,xx=pond.x+Math.cos(i*2.3)*pond.rx*.55;c.beginPath();c.moveTo(xx-16,yy);c.quadraticCurveTo(xx,yy+Math.sin(this.t+i)*2,xx+22,yy);c.stroke();}c.restore();
      }
      const visible=o=>{const height=o.type==='sectHall'?420:o.type==='pavilion'?170*(o.scale||1):170,extent=Math.max(150,o.radius||o.r||0);return Math.abs(o.x-this.camera.x)<hw+extent&&o.y>this.camera.y-hh-extent&&o.y-height<this.camera.y+hh;};
      const expedition=window.Xian.expeditionInfo?.(state);
      if(expedition)this.routeMarkers(c,expedition,visible);
      // Ground based effects behind characters, so every attack remains legible.
      for(const fx of state.effects||[])if(visible(fx)&&['warning','ring','burst','impact','heal'].includes(fx.type)&&!(expedition&&fx.type==='warning'&&fx.sourceId==='journey'))this.effect(c,fx);
      const items=this.scenery.filter(visible).map(o=>({kind:'scenery',o}));
      if(this.mapId==='sect')for(const o of this.sectFacilities(state))if(visible(o))items.push({kind:'scenery',o});
      for(const o of state.nodes||[])if(visible(o))items.push({kind:'node',o});
      for(const o of state.drops||[])if(visible(o))items.push({kind:'drop',o});
      for(const o of state.enemies||[])if(visible(o)&&o.hp>0&&!o.dormant)items.push({kind:'enemy',o});
      if(expedition?.objective&&visible(expedition.objective))items.push({kind:'escort',o:expedition.objective});
      const partnerId=state.worldlife?.companion,partner=window.Xian.CONTENT?.WORLD_NPCS?.[partnerId];
      if(partner&&!window.Xian.isSafe?.(state)){
        const a=(p.facing||0)+2.3,target={x:p.x+Math.cos(a)*45,y:p.y+Math.sin(a)*34};
        if(!this.companionDisplay||this.companionDisplay.id!==partnerId||this.companionDisplay.map!==this.mapId||Math.hypot(this.companionDisplay.x-p.x,this.companionDisplay.y-p.y)>180)this.companionDisplay={...target,id:partnerId,map:this.mapId};
        const companion=this.companionDisplay;companion.x+=(target.x-companion.x)*follow;companion.y+=(target.y-companion.y)*follow;
        items.push({kind:'companion',o:{...companion,...partner,x:companion.x,y:companion.y}});
      }else this.companionDisplay=null;
      items.push({kind:'player',o:p});items.sort((a,b)=>a.o.y-b.o.y);
      for(const item of items){
        if(item.kind==='scenery')this.scenerySprite(c,item.o);
        else if(item.kind==='node')this.node(c,item.o,p);
        else if(item.kind==='drop')this.drop(c,item.o);
        else if(item.kind==='enemy')this.enemy(c,item.o,p);
        else if(item.kind==='escort')this.escortTarget(c,item.o);
        else if(item.kind==='companion'){c.save();c.translate(item.o.x,item.o.y);this.npcCharacter(c,{...item.o,npcId:item.o.id});label(c,`${item.o.name} · 同行`,0,-126,'#e8c2b8',11);c.restore();}
        else this.player(c,p,state);
      }
      for(const o of state.projectiles||[])if(visible(o))this.projectile(c,o);
      for(const fx of state.effects||[])if(visible(fx)&&!['warning','ring','burst','impact','heal'].includes(fx.type))this.effect(c,fx);
      // Fireflies, drifting leaves and motes evoke cultivation without obscuring combat.
      const sourceId=this.mapMeta?.sourceMapId||this.mapId,cold=['snow','iceTrial'].includes(sourceId),fire=['red','fireTrial'].includes(sourceId);
      for(let i=0;i<(cold?65:24);i++){
        const x=this.camera.x+Math.sin(i*6.3+this.t*.12)*hw,y=this.camera.y+Math.cos(i*4.7+this.t*.17)*hh;
        c.globalAlpha=(cold?.5:.25)+Math.sin(this.t*2+i)*.16;ellipse(c,x,y,cold?1.9:1.6,cold?1.9:1.6,cold?'#f0f6e8':fire?'#ffb373':'#dae8b1');
      }c.globalAlpha=1;
      const activity=window.Xian.activityInfo?.(state);
      if(activity?.crystal){
        const v=activity.crystal;c.save();c.translate(v.x,v.y);shadow(c,0,0,38,13,.22);
        path(c,[[-39,1],[-31,-17],[31,-17],[39,1]],'#7f8d7c','#bac6a8',2);
        const pulse=Math.sin(this.t*3)*2;path(c,[[0,-87+pulse],[-22,-49+pulse],[0,-17+pulse],[24,-49+pulse]],'#8dcdb6','#dbf0cf',2);
        path(c,[[0,-87+pulse],[2,-18+pulse],[24,-49+pulse]],'#c5ead7');
        line(c,[[-7,-57+pulse],[0,-66+pulse],[10,-52+pulse]],'#eff9d7',2);
        label(c,'护山灵脉',0,-110,'#e5dfb1',13);c.fillStyle='#263b31';c.fillRect(-44,15,88,6);c.fillStyle='#a5d6ab';c.fillRect(-44,15,88*Math.max(0,v.hp/v.maxHp),6);c.restore();
      }
      const npcs=this.mapMeta?.npcs||[{id:'master',x:440,y:1680,name:'凌云真人'},{id:'forge',x:670,y:1800,name:'铸剑台'},{id:'alchemy',x:380,y:1900,name:'灵药炉'},{id:'shrine',x:580,y:1970,name:'聚灵阵'}];
      for(const o of npcs){
        const distance=Math.hypot(p.x-o.x,p.y-o.y),worldCharacter=window.Xian.CONTENT?.WORLD_NPCS?.[o.id],character=worldCharacter||window.Xian.CONTENT?.NPC_CHARACTERS?.[o.id];
        if(distance<(character?250:140)){
          const nameHeight=character||o.id==='master'?119:['forge','alchemy'].includes(o.id)?177:o.id==='shrine'?116:94;
          label(c,o.name||o.id,o.x,o.y-nameHeight,character?.color||'#f0e4b6',12);
          if(character){label(c,character.role,o.x,o.y-nameHeight+17,'#c5d2b5',10);const info=worldCharacter?window.Xian.worldNpcInfo?.(state,o.id):window.Xian.npcInfo?.(state,o.id),relation=worldCharacter?null:window.Xian.relationshipInfo?.(state,o.id);if(relation?.contract?.ready||info?.commission?.ready||info?.quests?.some(q=>q.canClaim))label(c,'◆',o.x,o.y-nameHeight-24,'#f3d58d',17);else if(info&&!info.met)label(c,'!',o.x,o.y-nameHeight-24,'#f3d58d',17);else if(relation?.contract?.accepted)label(c,'契约进行中',o.x,o.y-nameHeight-22,'#accfba',10);}
          if(distance<105)label(c,'[ E ] 交互',o.x,o.y+34,'#fcf3d4',11);
        }
      }
      for(const o of this.mapMeta?.portals||[]){if(Math.hypot(p.x-o.x,p.y-o.y)<175){label(c,o.name||'秘境入口',o.x,o.y-151,'#e4e5b9',12);if(Math.hypot(p.x-o.x,p.y-o.y)<105)label(c,'[ E ] 穿越灵门',o.x,o.y+30,'#fff0bd',11);}}
      // Viewport atmosphere applied in screen space.
      c.setTransform(this.dpr,0,0,this.dpr,0,0);
      const vignette=c.createRadialGradient(this.width/2,this.height/2,this.height*.2,this.width/2,this.height/2,this.width*.66);
      vignette.addColorStop(0,'rgba(7,29,29,0)');vignette.addColorStop(1,'rgba(7,29,29,.26)');c.fillStyle=vignette;c.fillRect(0,0,this.width,this.height);
      if(this.transition>0){this.transition=Math.max(0,this.transition-dt*1.8);c.fillStyle=`rgba(11,25,26,${this.transition*.62})`;c.fillRect(0,0,this.width,this.height);if(this.transition>.2)label(c,this.mapMeta?.name||'山海',this.width/2,this.height*.38,'#e5d9b5',26);}
    }
    routeMarkers(c,a,visible){
      const route=window.Xian.CONTENT?.ROUTES?.[a.id],current=a.stage-1;
      if(!route)return;
      c.save();c.setLineDash([7,15]);line(c,route.stations.map(s=>[s.x,s.y]),'#e1dbad38',2);c.setLineDash([]);
      route.stations.forEach((s,i)=>{if(!visible(s))return;const active=i===current&&!a.completed,done=i<current||a.completed,col=done?'#8dbb9c':active?'#eed59b':'#8a9b89';c.save();c.translate(s.x,s.y);
        shadow(c,0,0,32,10,.14);path(c,[[-23,5],[-28,-1],[-20,-9],[24,-9],[29,-1],[21,5]],'#82917b','#aeb79a');
        line(c,[[0,-5],[0,-78]],'#687a63',4);path(c,[[0,-78],[35,-68],[0,-52]],col,'#d6d4ae',1);label(c,String(i+1),14,-65,'#253e35',11);
        if(active){const bob=Math.sin(this.t*3)*3;path(c,[[-8,-109+bob],[8,-109+bob],[0,-100+bob]],'#f3da9d');label(c,s.name,0,-130,col,14);label(c,a.failed?'历练失败 · N 返程':a.phase==='fight'?`清敌 ${a.remainingEnemies}`:a.phase==='choice'&&a.near?'[ E ] 决定路线':'走近路标 · E',0,25,a.failed?'#ebb094':col,11);}
        else label(c,done?'已通过':s.name,0,-95,col,11);c.restore();
      });
      // Only current gameplay warnings are drawn; their timer and radius come from the route.
      for(const w of a.warnings||[]){if(!visible(w))continue;const ice=w.element==='ice'||a.id==='frostVault',col=ice?'#ceeaf3':'#ffba7d';c.save();c.translate(w.x,w.y);ellipse(c,0,0,w.radius,w.radius,ice?'#b3d8e024':'#eb7c4529',col,2);c.setLineDash([4,7]);ellipse(c,0,0,w.radius+5,w.radius+5,null,col+'80',1);c.setLineDash([]);
        if(ice)for(let i=0;i<6;i++){const t=i*TAU/6;line(c,[[Math.cos(t)*8,Math.sin(t)*8],[Math.cos(t)*22,Math.sin(t)*22]],col,2);}else path(c,[[0,-25],[-15,0],[-10,14],[8,17],[17,0],[5,-12],[4,4]],null,col,2);
        label(c,`${ice?'落冰':'落火'} · ${Math.max(0,w.remaining).toFixed(1)}秒`,0,-w.radius-15,col,11);c.restore();}
      c.restore();
    }
    escortTarget(c,o){
      c.save();c.translate(o.x,o.y);shadow(c,0,0,37,11,.24);
      for(const x of [-26,26]){ellipse(c,x,6,9,9,'#384c40','#b0a07c',2);line(c,[[x-6,6],[x+6,6]],'#a18e6c',2);}
      path(c,[[-35,0],[-29,-27],[27,-27],[36,0]],'#8c7958','#d3bb85',2);path(c,[[-29,-27],[-20,-40],[20,-40],[27,-27]],'#b09b6c','#e2cfa2',1);line(c,[[0,-38],[0,-3]],'#788567',4);
      path(c,[[-9,-31],[0,-39],[9,-31],[0,-23]],'#b9d5ad','#e7e7c3',1);label(c,'护送灵材箱',0,-61,'#eee1b6',12);
      c.fillStyle='#203c32';c.fillRect(-43,22,86,6);c.fillStyle=o.hp<o.maxHp*.35?'#de9d7e':'#b4d09a';c.fillRect(-43,22,86*Math.max(0,o.hp/o.maxHp),6);label(c,`${Math.ceil(o.hp)} / ${o.maxHp}`,0,39,'#e0e8c5',10);c.restore();
    }
    scenerySprite(c,o){
      c.save();c.translate(o.x,o.y);c.scale(o.scale||1,o.scale||1);
      if(o.type==='temple'&&this.currentPlayer.y<o.y&&this.currentPlayer.y>o.y-190&&Math.abs(this.currentPlayer.x-o.x)<120*(o.scale||1))c.globalAlpha=.38;
      if(o.type==='pavilion'&&this.currentPlayer.y<o.y&&this.currentPlayer.y>o.y-150*(o.scale||1)&&Math.abs(this.currentPlayer.x-o.x)<82*(o.scale||1))c.globalAlpha=.35;
      if(['forge','alchemy'].includes(o.type)&&this.currentPlayer.y<o.y&&this.currentPlayer.y>o.y-130*(o.scale||1)&&Math.abs(this.currentPlayer.x-o.x)<78*(o.scale||1))c.globalAlpha=.4;
      const sway=Math.sin(this.t*1.1+(o.seed||0))*.012;
      switch(o.type){
        case 'townHouse':case 'warehouse':case 'marketStall':case 'cargo':case 'mooring':case 'junkBoat':case 'sarcophagus':case 'cryptPillar':case 'cryptBrazier':case 'cloudArch':case 'starArmillary':case 'stoneDesk':case 'planter':case 'fishingNet':case 'brokenPot':case 'stoneShard':this.livingScenery(c,o);break;
        case 'sectFacility':this.sectFacility(c,o);break;
        case 'sectHall':{
          if(this.currentPlayer.y<o.y&&this.currentPlayer.y>o.y-380&&Math.abs(this.currentPlayer.x-o.x)<255)c.globalAlpha=.35;
          if(this.sprites.sectHall)c.drawImage(this.sprites.sectHall,-310,-390,620,413);
          else this.building(c,460,190,'#315e55',true);
          label(c,o.name||'青云大殿',0,-54,'#ead49c',17);break;
        }
        case 'pavilion':{
          if(this.illustrated(c,'pavilionV4',210,160))break;
          this.building(c,130,77,['red','fireTrial'].includes(this.mapId)?'#6d5645':'#486c59',false);
          for(let i=0;i<6;i++){const x=-42+i*16;line(c,[[x,-54],[x,-19]],'#e4d9b477',.7);}
          path(c,[[-56,4],[-67,14],[67,14],[56,4]],'#b0b69d','#778b75');
          line(c,[[-44,-7],[44,-7]],'#758776',4);break;
        }
        case 'wall':{
          shadow(c,0,0,38,7,.12);c.fillStyle='#b4b9a5';c.fillRect(-38,-30,76,30);
          c.strokeStyle='#7b8e7c';for(let y=-29;y<0;y+=10)for(let x=-37;x<38;x+=25)c.strokeRect(x+(y%20?12:0),y,24,9);
          path(c,[[-43,-29],[0,-39],[43,-29],[37,-24],[-37,-24]],'#486c5a','#a1b59a');break;
        }
        case 'lantern':{
          shadow(c,0,0,11,4,.15);const stone=c.createLinearGradient(-9,0,9,-12);stone.addColorStop(0,'#687767');stone.addColorStop(.5,'#b8b59b');stone.addColorStop(1,'#87967d');path(c,[[-8,0],[-6,-9],[6,-9],[8,0]],stone,'#5b6e59',.8);line(c,[[0,-9],[0,-69]],'#544e37',4);line(c,[[-1,-10],[-1,-69]],'#b6a175',1);
          line(c,[[-8,-64],[15,-64]],'#726144',3);line(c,[[-8,-66],[15,-66]],'#c2ac7a',.8);line(c,[[13,-64],[13,-52]],'#c1a56e',1);path(c,[[8,-54],[13,-57],[18,-54]],'#9d8050','#e0c28a',.6);
          const glow=c.createRadialGradient(13,-42,2,13,-42,24);glow.addColorStop(0,'#edc87740');glow.addColorStop(1,'#edc87700');c.fillStyle=glow;c.fillRect(-12,-65,50,46);
          const paper=c.createRadialGradient(11,-43,1,13,-42,12);paper.addColorStop(0,'#fff0ba');paper.addColorStop(.6,'#e5be72');paper.addColorStop(1,'#95663c');ellipse(c,13,-42,8,11,paper,'#eee1ac',.7);for(const dx of [-4,0,4])line(c,[[13+dx,-50],[13+dx,-33]],'#9a784f77',.6);line(c,[[7,-34],[19,-34]],'#b28a54',1.3);line(c,[[13,-30],[13,-24]],'#d0b87e',1);break;
        }
        case 'bench':{
          shadow(c,0,0,33,8,.14);const wood=c.createLinearGradient(0,-22,0,-7);wood.addColorStop(0,'#b59b73');wood.addColorStop(.6,'#8d6c48');wood.addColorStop(1,'#594e38');path(c,[[-35,-10],[-28,-21],[35,-21],[28,-10]],wood,'#c1b18b',.6);path(c,[[-35,-10],[28,-10],[28,-6],[-35,-6]],'#65543b','#a48b61',.5);
          for(const x of [-24,24]){line(c,[[x,-8],[x,2]],'#534d37',5);line(c,[[x-1,-8],[x-1,1]],'#b4a17a',1);}for(let i=0;i<4;i++)line(c,[[-28+i,-19+i*2],[4,-18+i*2],[28-i,-19+i*2]],'#d8ba8355',.5);line(c,[[-28,-16],[29,-16]],'#735739',.6);break;
        }
        case 'well':{
          shadow(c,0,0,33,11,.17);ellipse(c,0,-6,29,15,'#9fa990','#d0ccac',2);ellipse(c,0,-12,26,12,'#3f645b','#9fa990',5);
          for(const x of [-25,25])line(c,[[x,-5],[x,-64]],'#6d7253',4);line(c,[[-29,-62],[29,-62]],'#a09971',5);line(c,[[0,-62],[0,-27]],'#bfa882',1.5);path(c,[[-7,-32],[-6,-19],[7,-19],[8,-32]],'#9d8760','#c4b184');break;
        }
        case 'cart':{
          shadow(c,0,0,35,10,.17);for(const x of [-29,29])ellipse(c,x,-6,9,9,'#6c694c','#b0a37a',2);
          for(const x of [-29,29])for(let i=0;i<6;i++){const a=i*TAU/6;line(c,[[x,-6],[x+Math.cos(a)*7,-6+Math.sin(a)*7]],'#bda679',1);}
          path(c,[[-31,-12],[-29,-31],[30,-31],[32,-12]],'#917950','#bea275');line(c,[[-25,-15],[26,-15]],'#ccb387',1);
          for(let i=0;i<5;i++)line(c,[[-29,-28+i*3],[30,-28+i*3]],i%2?'#b99b6933':'#594c352e',.7);for(const x of [-26,26]){line(c,[[x,-30],[x,-13]],'#4e523b',2);ellipse(c,x,-27,1,1,'#cfc4a0');}
          for(let i=0;i<4;i++)path(c,[[-24+i*13,-33],[-19+i*13,-43],[-11+i*13,-34]],['#a6ba83','#b79f70','#a1beaa','#c3b18b'][i]);line(c,[[32,-15],[63,-3]],'#7f7552',3);break;
        }
        case 'board':case 'sign':{
          shadow(c,0,0,25,6,.15);for(const x of [-17,17]){line(c,[[x,0],[x,-54]],'#66543b',4);line(c,[[x-1,-1],[x-1,-53]],'#b4a27a',.8);}
          const wood=c.createLinearGradient(-26,-48,26,-22);wood.addColorStop(0,'#b6a17c');wood.addColorStop(.5,'#87714d');wood.addColorStop(1,'#65563e');path(c,[[-26,-48],[-26,-22],[26,-22],[26,-48]],wood,'#c7b58b',.8);for(let i=0;i<6;i++)line(c,[[-24,-46+i*4],[6,-47+i*4],[24,-46+i*4]],'#e3d1a533',.4);for(const x of [-23,23])for(const y of [-45,-25])ellipse(c,x,y,1,1,'#e6d3a1');
          if(o.type==='board'){for(let i=0;i<3;i++){c.fillStyle='#d4cba7';c.fillRect(-18+i*13,-43,10,15);line(c,[[-15+i*13,-39],[-12+i*13,-32]],'#837e5f',1);}}
          else {line(c,[[-15,-36],[14,-36],[8,-41]],'#e3d5ae',2);label(c,'山径',0,-26,'#e2d5af',9);}break;
        }
        case 'garden':{
          if(this.illustrated(c,'herb-gardenV4',111,64,.69))break;
          path(c,[[-48,-18],[37,-18],[48,14],[-37,14]],'#61734d','#c0b58b',2);
          for(let row=0;row<3;row++)for(let col=0;col<6;col++){const x=-34+col*12+row*3,y=-12+row*9;
            line(c,[[x,y+2],[x,y-8]],'#47653b',1.5);path(c,[[x,y-3],[x-7,y-8],[x-3,y-9],[x,y-6],[x+7,y-12],[x+5,y-3]],'#91b971');
            if((row+col)%3===0)ellipse(c,x,y-10,2,2,'#e1d6a3');
          }break;
        }
        case 'site':{
          const claimed=window.Xian.siteInfo?.(this.currentState,o.siteId)?.claimed;
          if(o.kind==='herb'||o.kind==='garden')this.scenerySprite(c,{type:'garden',x:0,y:0,scale:1.4});
          else if(o.kind==='tablet'||o.kind==='relic'){
            path(c,[[-25,0],[-20,-61],[-8,-74],[21,-64],[27,0]],'#879580','#c2c5a8',2);
            line(c,[[-10,-55],[9,-55],[3,-45],[-10,-40],[9,-33],[-3,-22]],'#cfcca1',2);line(c,[[-29,0],[30,0]],'#74846f',7);
          }else{
            path(c,[[-26,0],[-26,-24],[25,-24],[27,0]],claimed?'#6f775b':'#9b8056','#c0ad7c',2);
            path(c,[[-29,-23],[-21,-37],[21,-37],[29,-23]],claimed?'#78896a':'#ad9365','#d6bd85',2);
            for(const x of [-16,15])line(c,[[x,-35],[x,0]],'#596649',3);c.fillStyle='#d7c88f';c.fillRect(-4,-20,8,7);
          }
          if(Math.hypot(this.currentPlayer.x-o.x,this.currentPlayer.y-o.y)<160){label(c,o.name||'山海遗藏',0,-91,'#e6d09c',12);label(c,claimed?'已探明':'[ E ] 探索',0,-72,claimed?'#a8b397':'#eee7bc',10);}break;
        }
        case 'npcCharacter':this.npcCharacter(c,o);break;
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
        case 'snowPine':{
          shadow(c,0,0,31,10,.18);
          if(this.sprites.pine)c.drawImage(this.sprites.pine,-47,-116,94,120);
          else this.scenerySprite(c,{type:'pine',x:0,y:0,scale:1,seed:o.seed});
          for(let i=0;i<9;i++){const a=i*1.7,x=Math.sin(a)*29,y=-36-(i%4)*20;ellipse(c,x,y,12,3,'rgba(224,240,224,.68)');}break;
        }
        case 'deadTree':{
          if(this.illustrated(c,'dead-treeV4',114,145,.94))break;
          shadow(c,0,0,25,9,.2);line(c,[[0,0],[-3,-35],[5,-77]],'#554e43',8);
          line(c,[[-3,-28],[-23,-43],[-35,-64]],'#554e43',5);line(c,[[0,-40],[27,-55],[30,-83]],'#554e43',4);
          line(c,[[-23,-43],[-42,-41]],'#554e43',3);line(c,[[27,-55],[43,-59]],'#554e43',3);line(c,[[3,-70],[-9,-91]],'#554e43',3);
          for(let i=0;i<4;i++)ellipse(c,Math.sin(i*2)*26,-40-Math.cos(i*2)*17,6,2,'#b49c65');break;
        }
        case 'iceRock':case 'iceSpire':{
          if(o.type==='iceSpire'&&this.illustrated(c,'ice-spireV4',77,103,.92))break;
          if(o.type==='iceRock'&&this.sprites.rockV4){c.filter='saturate(.3) hue-rotate(140deg) brightness(1.25)';this.illustrated(c,'rockV4',58,45,.83);c.filter='none';break;}
          shadow(c,0,0,22,9,.16);const h=o.type==='iceSpire'?85:38;
          path(c,[[-23,0],[-17,-h*.55],[0,-h],[17,-h*.64],[25,-3],[4,7]],'#8dbdca','#c6e5db',1.4);
          path(c,[[0,-h],[1,5],[17,-h*.64]],'#c1e3e0');path(c,[[-23,0],[0,-h],[1,5]],'#629daf');
          line(c,[[0,-h],[1,5]],'#e2f4e7',1);ellipse(c,-7,-2,13,3,'#d4e6dc99');break;
        }
        case 'pillar':{
          if(this.illustrated(c,'stone-pillarV4',57,120,.98))break;
          shadow(c,0,0,27,9,.23);path(c,[[-21,2],[-25,-7],[25,-7],[21,2]],'#77786b','#9da794');
          path(c,[[-13,-7],[-13,-84],[13,-84],[13,-7]],'#73796d','#9eaa92');path(c,[[0,-7],[0,-84],[13,-84],[13,-7]],'#555f5b');
          path(c,[[-18,-84],[-23,-94],[18,-94],[18,-84]],'#8a9481','#abb99a');
          line(c,[[-8,-21],[-5,-46],[0,-51],[8,-64]],'#384c47',1.5);
          if(this.mapId==='fireTrial'){ellipse(c,0,-98,13,5,'#d29c5d');path(c,[[-9,-98],[-4,-117],[0,-105],[6,-124],[9,-102],[0,-94]],'#eaa76a');}
          break;
        }
        case 'bamboo':{
          if(this.sprites.bambooV4){if(this.currentPlayer.y<o.y&&this.currentPlayer.y>o.y-120&&Math.abs(this.currentPlayer.x-o.x)<44)c.globalAlpha=.38;c.rotate(sway);this.illustrated(c,'bambooV4',105,148);break;}
          shadow(c,0,0,22,6,.12);
          for(let i=0;i<5;i++){const x=(i-2)*9,ht=66+(i%3)*19;line(c,[[x,0],[x+Math.sin(this.t+i)*2,-ht]],'#416e52',4);line(c,[[x-1,0],[x-1,-ht]],'#75a57b',1);
            for(let k=14;k<ht;k+=16){line(c,[[x-2,-k],[x+2,-k]],'#b3c798',1);for(let side of [-1,1]){path(c,[[x,-k],[x+side*25,-k-9],[x+side*9,-k-2]],'#326851');path(c,[[x,-k-6],[x+side*16,-k-24],[x+side*6,-k-10]],'#538a62');}}
          }break;
        }
        case 'rock':{
          if(this.illustrated(c,'rockV4',55,47,.83))break;
          shadow(c,0,0,21,9,.15);path(c,[[-24,-4],[-18,-24],[-1,-34],[18,-23],[23,-3],[9,5]],'#7e8c80','#566b63');path(c,[[-18,-24],[-1,-34],[5,-14],[-5,1],[-24,-4]],'#9eaa93');line(c,[[-1,-30],[5,-14],[18,-23]],'#bbc1a4',1);ellipse(c,-8,-2,10,3,'#6a855c');break;
        }
        case 'bush':{
          shadow(c,0,0,26,7,.12);
          line(c,[[-12,1],[-8,-21],[2,-35]],'#476844',3);line(c,[[8,1],[12,-18],[24,-29]],'#476844',2.5);
          for(let j=0;j<18;j++){const x=Math.sin(j*2.7)*25,y=-12-Math.cos(j*1.3)*12;
            path(c,[[x-8,y],[x-4,y-5],[x+2,y-7],[x+7,y-2],[x+4,y+2],[x-2,y+4]],j%3?'#648b59':'#8da871');
            line(c,[[x-5,y+1],[x+4,y-3]],'#bad19255',.6);
          }break;
        }
        case 'temple':if(!this.illustrated(c,'pavilionV4',240,182))this.building(c,150,85,'#2d6864',true);break;
        case 'forge':{
          if(this.illustrated(c,'forgeV4',181,150))break;
          this.building(c,77,48,'#786b51',false);path(c,[[-20,0],[-25,-11],[22,-11],[28,-19],[31,-15],[19,-2],[10,0],[14,12],[-12,12],[-8,0]],'#354c4b','#b3b29b');ellipse(c,32,-5,8,4,'#cf8e48');ellipse(c,31,-11,4,8,'#efb563');break;
        }
        case 'alchemy':{
          if(this.illustrated(c,'alchemy-lodgeV4',175,149)){
            const flame=c.createRadialGradient(0,-31,0,0,-31,32);flame.addColorStop(0,'#ffb75d35');flame.addColorStop(1,'#ffb75d00');ellipse(c,0,-31,32,25,flame);
            for(let i=0;i<3;i++){c.globalAlpha=.13;ellipse(c,Math.sin(this.t*1.2+i)*6,-61-i*10-(this.t*5+i*7)%12,7+i*2,5,'#e8e7cd');}c.globalAlpha=1;break;
          }
          shadow(c,0,0,42,13);line(c,[[-37,0],[-37,-63],[37,-63],[37,0]],'#5b6650',4);path(c,[[-48,-56],[0,-77],[47,-56],[31,-51],[-31,-51]],'#697c61','#acc09b');
          ellipse(c,0,3,24,8,'#2c5352');ellipse(c,0,-13,25,24,'#436561','#abc2a5',2);ellipse(c,0,-32,25,8,'#214947','#94b396',2);ellipse(c,0,-34,18,5,'#679a7c');line(c,[[-20,-15],[-30,-22],[-28,-29],[-20,-26]],'#bfd0aa',3);line(c,[[20,-15],[30,-22],[28,-29],[20,-26]],'#bfd0aa',3);
          for(let i=0;i<3;i++){c.globalAlpha=.18;ellipse(c,Math.sin(this.t+i)*10,-44-i*12,9+i*3,6,'#cbe9c9');}c.globalAlpha=1;break;
        }
        case 'shrine':{
          if(this.illustrated(c,'jade-shrineV4',108,115,.92))break;
          shadow(c,0,0,45,14);path(c,[[-43,-10],[-33,-23],[35,-23],[45,-10],[45,7],[-43,7]],'#8c9d89','#c8ccaa',2);
          path(c,[[-32,-14],[-28,-45],[28,-45],[32,-14]],'#6e8977','#b4c5a4');
          for(const side of [-1,1]){line(c,[[side*31,-4],[side*31,-41]],'#8c825a',3);path(c,[[side*31-5,-35],[side*31,-51],[side*31+5,-35]],'#dfc984');}
          const g=c.createRadialGradient(0,-39,1,0,-39,36);g.addColorStop(0,'rgba(126,232,192,.25)');g.addColorStop(1,'rgba(126,232,192,0)');c.fillStyle=g;c.fillRect(-36,-76,72,72);path(c,[[0,-74],[13,-44],[0,-21],[-13,-44]],'#9ed5b4','#edf6c8',1);
          label(c,'归元',0,-8,'#dbe1b6',10);break;
        }
        case 'master':this.npcCharacter(c,{...o,npcId:'master'});break;
        case 'storyteller':this.npcCharacter(c,{...o,skin:'scholar'});break;
        case 'merchant':{
          if(this.sprites.pavilionV4){c.save();this.illustrated(c,'pavilionV4',143,119,.88);c.translate(0,13);this.npcCharacter(c,{...o,skin:'broker'});c.restore();break;}
          shadow(c,0,0,44,13,.2);for(const x of [-38,38])line(c,[[x,0],[x,-65]],'#66735e',3);
          path(c,[[-46,-62],[0,-83],[46,-62],[37,-55],[-37,-55]],'#7e9171','#c1c59a');
          path(c,[[-39,-10],[-39,-25],[39,-25],[39,-10]],'#957e58','#c9b785');
          for(let i=0;i<5;i++)ellipse(c,-25+i*12,-31,5,8,['#bfc9a0','#8dbfac','#d7b77b','#a8bacc','#ddbd9e'][i]);
          this.npcCharacter(c,{...o,skin:'broker'});break;
        }
        case 'portal':{
          const color=ELEMENT_COLORS[this.mapId==='fireTrial'||o.target==='fireTrial'?'fire':this.mapId==='iceTrial'||o.target==='iceTrial'?'ice':'wood'];
          if(this.sprites['spirit-gateV4']){shadow(c,0,0,39,13,.2);this.illustrated(c,'spirit-gateV4',109,127,.95);c.globalCompositeOperation='screen';const g=c.createRadialGradient(0,-45,2,0,-45,30);g.addColorStop(0,color+'38');g.addColorStop(1,color+'00');ellipse(c,0,-45,29,43,g);for(let i=0;i<5;i++){const a=this.t*.7+i*TAU/5;ellipse(c,Math.cos(a)*17,-45+Math.sin(a)*25,1.4,2,color);}break;}
          shadow(c,0,0,38,12,.2);ellipse(c,0,0,37,16,'#687f73','#aec6a1',2);
          for(const side of [-1,1])path(c,[[side*31-7,0],[side*31-5,-62],[side*31+5,-70],[side*31+7,-2]],'#809585','#c4d1ab');
          const g=c.createRadialGradient(0,-37,0,0,-37,42);g.addColorStop(0,color+'77');g.addColorStop(1,color+'00');ellipse(c,0,-37,42,48,g);
          ellipse(c,0,-36,24,33,null,color,2);ellipse(c,0,-36,18,26,null,color+'aa',1);
          for(let i=0;i<6;i++){const a=this.t*.7+i*TAU/6;ellipse(c,Math.cos(a)*23,-36+Math.sin(a)*32,2,2,color);}
          break;
        }
        case 'gate':case 'ruinGate':{
          const old=o.type==='ruinGate';shadow(c,0,0,65,14);for(const x of [-45,45]){const col=c.createLinearGradient(x-8,0,x+8,0);col.addColorStop(0,old?'#586e65':'#554733');col.addColorStop(.4,old?'#a4b3a3':'#a59469');col.addColorStop(1,old?'#6b7c70':'#6a5136');path(c,[[x-7,2],[x-7,-88],[x+7,-88],[x+7,2]],col,'#b3b798',.8);path(c,[[x-13,1],[x-13,9],[x+13,9],[x+13,1]],'#939f8d','#b5bba1',.8);for(let j=0;j<8;j++)line(c,[[x-4,-12-j*9],[x-2,-19-j*9]],old?'#d9debd44':'#d7bd8955',.7);if(old)line(c,[[x-3,-72],[x+3,-56],[x-4,-45]],'#46574d',.8);}
          const roof=c.createLinearGradient(0,-108,0,-73);roof.addColorStop(0,'#71917a');roof.addColorStop(.55,old?'#55756e':'#31675e');roof.addColorStop(1,'#223f35');path(c,[[-60,-85],[0,-108],[60,-85],[47,-81],[-47,-81]],roof,'#a8baa0',1);path(c,[[-57,-83],[0,-96],[58,-83],[38,-73],[-38,-73]],roof,'#9eb394',.6);for(let i=-7;i<=7;i++)line(c,[[i*7,-79],[i*5,-91]],'#c3ceb066',.7);line(c,[[-54,-81],[0,-78],[54,-81]],'#d1c497',1);line(c,[[-39,-94],[0,-109],[39,-94]],'#bcba93',1.2);
          c.fillStyle='#39574b';c.fillRect(-20,-81,40,17);c.strokeStyle='#ccb68a';c.lineWidth=.6;c.strokeRect(-20,-81,40,17);label(c,old?'古墟':'青云',0,-71,'#d5c792',12);break;
        }
      }c.restore();
    }
    npcCharacter(c,o){
      // NPCs have their own silhouettes and tools. Player artwork is never a fallback.
      const skin=o.npcId==='master'?'master':o.skin||o.npcId||'scholar';
      const styles={
        master:['elder','#536f84','#d7c59a','crown','staff'],
        elder:['elder','#ded7bd','#789788','cap','book'],
        disciple:['fighter','#5b8984','#c8d5bb','tail','sword'],
        qinghe:['fighter','#5b8984','#c8d5bb','tail','sword'],
        yanming:['stocky','#71574e','#d4a46f','band','hammer'],
        ruoshui:['female','#6c9aa7','#e5e4ca','bun','book'],
        herbalist:['female','#879d63','#dbbf91','straw','basket'],
        hunter:['fighter','#847655','#baaa7a','hood','spear'],
        broker:['stocky','#806681','#e2bd82','cap','abacus'],
        fireArtisan:['stocky','#815b4b','#d8ac79','band','hammer'],
        snowHealer:['female','#7d9faf','#e3e6d3','braid','lantern'],
        swordswoman:['female','#b9c9d2','#ba6470','tail','sword'],
        musician:['female','#9573a2','#f0ccaa','double','lute'],
        alchemist:['female','#789470','#e0ca86','bun','bottle'],
        thief:['crouch','#405967','#a9c2bf','hood','dagger'],
        captain:['female','#486e81','#dab173','band','sabre'],
        fisher:['stocky','#8d7c60','#c9c6a3','straw','rod'],
        scholar:['slender','#bcbcaf','#4e7774','cap','scroll'],
        guard:['fighter','#526f77','#c4b28a','helmet','halberd'],
        monk:['stocky','#aa8259','#ded0a2','bald','beads'],
        mechanist:['slender','#807c68','#c8ac71','goggles','gear'],
        diviner:['female','#666b97','#dcc19d','crown','fan'],
        hermit:['elder','#9c9e93','#dde0c7','loose','staff'],
        dancer:['female','#bc8286','#f0d8b0','double','fan'],
        sailor:['fighter','#738b9a','#d3b083','band','rope'],
        priest:['elder','#9492a5','#d9ccb0','crown','scroll'],
        trialKeeper:['spirit','#629c90','#cae8c3','crown','seal']
      };
      const aliases={swordMaiden:'swordswoman',femaleSword:'swordswoman',songstress:'musician',pilferer:'thief',boatman:'captain',archaeologist:'scholar',engineer:'mechanist',astrologer:'diviner'};
      const profile=styles[skin]||styles[aliases[skin]]||styles.scholar;
      const [shape,coat,trim,hair,tool]=profile,bob=Math.sin(this.t*1.8+(o.x||0)*.01)*.65;
      const female=shape==='female',old=shape==='elder',stocky=shape==='stocky',crouch=shape==='crouch';
      const width=stocky?20:female?13:16,headY=crouch?-56:old?-76:-73;
      shadow(c,0,0,stocky?27:23,8,.21);c.save();c.translate(0,bob);c.lineJoin='round';c.lineCap='round';
      if(shape==='spirit'){
        const glow=c.createRadialGradient(0,-43,2,0,-43,49);glow.addColorStop(0,'#b9efce44');glow.addColorStop(1,'#b9efce00');ellipse(c,0,-43,49,49,glow);
        path(c,[[-27,-5],[-17,-45],[-22,-72],[0,-95],[22,-72],[17,-45],[27,-5],[7,-17],[0,-7],[-8,-18]],coat,trim,1.6);
        path(c,[[-15,-67],[0,-81],[15,-67],[9,-49],[0,-43],[-9,-49]],'#c2d6c5','#e5f0d7');
        line(c,[[-10,-63],[-4,-59]],'#365d5d',2);line(c,[[10,-63],[4,-59]],'#365d5d',2);
        path(c,[[0,-36],[8,-24],[0,-13],[-8,-24]],'#e0db9c');
        for(let i=0;i<5;i++){const a=this.t*.5+i*TAU/5;path(c,[[Math.cos(a)*33,-47+Math.sin(a)*27-3],[Math.cos(a)*33+3,-47+Math.sin(a)*27],[Math.cos(a)*33,-47+Math.sin(a)*27+3]],'#d9edc1');}
        c.restore();return;
      }
      // Hair and back garments create different outlines before the body is painted.
      if(female||hair==='loose'||hair==='tail'){
        path(c,[[-11,headY-5],[-15,headY+14],[-18,-22],[-9,-30],[-4,-12],[3,-36],[10,-24],[14,headY+9],[9,headY-7]],old?'#c9cfbf':'#253c42','#536468',.7);
        if(hair==='tail'){const sw=Math.sin(this.t*2)*3;path(c,[[5,headY-7],[20,headY-11],[24+sw,headY+9],[35+sw,headY+25],[21+sw,headY+21],[12,headY]],'#2c4247','#748583',.6);}
      }
      if(tool==='sword'||tool==='sabre'){
        line(c,[[-23,-8],[-6,-85]],'#293f45',7);line(c,[[-24,-8],[-7,-85]],trim,1.3);line(c,[[-13,-67],[1,-64]],'#bbaa74',4);
        line(c,[[-7,-75],[-4,-88]],'#b6bab1',4);line(c,[[-7,-84],[-1,-83]],trim,1.2);
      }
      // Feet and layered robe: tailored coats, wide work aprons and long skirts differ in shape.
      ellipse(c,-9,0,8,3,'#293f40');ellipse(c,10,0,8,3,'#293f40');
      const cloth=c.createLinearGradient(-width,-60,width,0);cloth.addColorStop(0,coat);cloth.addColorStop(.42,trim);cloth.addColorStop(.47,coat);cloth.addColorStop(1,'#334d50');
      const shoulderY=headY+15,waistY=crouch?-20:-31;
      if(female){
        path(c,[[-11,shoulderY],[-15,-40],[-10,waistY],[-25,-1],[-10,3],[0,-3],[12,2],[25,-2],[10,waistY],[15,-42],[10,shoulderY]],cloth,'#314b4b',1.2);
        for(const [x,y] of [[-16,0],[-6,0],[7,0],[17,0]])line(c,[[x*.38,waistY+3],[x,y-3]],'#e0e2cc55',1);
      }else{
        path(c,[[-width,shoulderY],[-width-2,waistY],[-width-5,-3],[-3,-1],[0,-17],[5,-2],[width+5,-4],[width,waistY],[width,shoulderY]],cloth,'#334b4b',1.2);
        line(c,[[-5,waistY+2],[-11,-4]],'#263f4666',2);line(c,[[5,waistY+2],[13,-5]],'#dce0c066',1);
      }
      const sleeveWidth=female?14:stocky?15:11;
      path(c,[[-width+3,shoulderY],[-width-sleeveWidth,shoulderY+18],[-width-sleeveWidth+4,waistY+4],[-width+2,waistY-1],[-width+7,shoulderY+10]],coat,trim,.8);
      path(c,[[width-3,shoulderY],[width+11,shoulderY+9],[width+17,waistY-8],[width+7,waistY+1],[width-5,shoulderY+15]],coat,trim,.8);
      ellipse(c,-width-5,waistY+1,4.2,5.2,'#d8b394','#f0ceb0',.5);ellipse(c,width+10,waistY-5,4.4,5.2,'#d8b394','#f0ceb0',.5);
      path(c,[[-9,shoulderY],[0,shoulderY+20],[9,shoulderY],[-1,shoulderY+10]],trim,'#e9dec266',.8);
      line(c,[[-width,waistY],[width,waistY]],trim,5);ellipse(c,3,waistY,3,3,'#e1c585','#fff1c2',.6);
      line(c,[[3,waistY+3],[9,-7],[15,-13]],trim,2);
      if(stocky&&tool==='hammer')path(c,[[-12,-43],[-14,-3],[17,-3],[12,-43]],'#765844','#d1ae7a',1);
      if(tool==='halberd'){for(let row=0;row<5;row++)for(let col=-1;col<=1;col++)path(c,[[col*8-4,-49+row*7],[col*8+4,-49+row*7],[col*8+3,-44+row*7],[col*8-3,-44+row*7]],'#91a4a4','#c2c8aa',.5);}
      // The face remains readable at play scale. Headwear encodes occupation and age.
      ellipse(c,0,headY+3,9.6,12.2,'#dab799','#eed2b1',.6);
      if(hair!=='bald'){
        path(c,[[-10,headY+3],[-10,headY-6],[-4,headY-12],[6,headY-10],[11,headY-2],[9,headY+7],[5,headY-1],[-2,headY-4],[-7,headY+5]],old?'#d9ddc9':'#283c40','#526264',.8);
      }
      line(c,[[-6,headY+4],[-3,headY+4]],'#3e4240',.9);line(c,[[3,headY+4],[6,headY+4]],'#3e4240',.9);line(c,[[0,headY+9],[3,headY+9]],female?'#a76361':'#8f7262',.7);
      if(skin==='captain'){line(c,[[-9,headY],[8,headY+6]],'#374a4b',1.2);ellipse(c,5,headY+4,3.5,3,'#35494a');}
      if(old){path(c,[[-7,headY+9],[-5,headY+23],[0,headY+32],[5,headY+21],[7,headY+9],[0,headY+14]],'#e0e1cc','#b5c0b1',.6);line(c,[[-11,headY],[-8,headY+21]],'#e5e2cf',2);}
      if(hair==='bun'||hair==='double'||hair==='braid'||hair==='tail'){
        ellipse(c,hair==='double'?-9:0,headY-11,hair==='double'?5:7,5,'#263c41','#7c8780',.7);if(hair==='double')ellipse(c,9,headY-11,5,5,'#263c41','#7c8780',.7);
        line(c,[[-11,headY-9],[12,headY-12]],trim,1.6);ellipse(c,12,headY-12,2.5,2.5,trim);
        if(hair==='braid')for(let i=0;i<7;i++)ellipse(c,10+Math.sin(i)*1.5,headY+12+i*4,3,3,'#304344',trim,.3);
      }else if(hair==='cap'||hair==='crown'){
        path(c,[[-10,headY-5],[-8,headY-21],[7,headY-21],[11,headY-5]],hair==='cap'?'#3f5355':trim,'#9cac92',.9);
        line(c,[[-11,headY-5],[12,headY-5]],trim,2);if(hair==='crown')path(c,[[0,headY-27],[-4,headY-17],[0,headY-12],[4,headY-17]],'#749e9c','#f1dab0',1);
      }else if(hair==='straw'){
        path(c,[[-25,headY-1],[-1,headY-22],[25,headY-1],[9,headY+3],[-13,headY+3]],'#af9871','#e3cc9d',1.2);
        for(let i=-3;i<=3;i++)line(c,[[0,headY-20],[i*7,headY]],'#675e444c',1);
      }else if(hair==='hood'){
        path(c,[[-12,headY+12],[-15,headY-5],[-3,headY-19],[9,headY-12],[14,headY+12],[7,headY+6],[6,headY-3],[-5,headY-6],[-8,headY+9]],coat,'#8aa49d',1);
        if(crouch)path(c,[[-9,headY+8],[9,headY+8],[7,headY+16],[-8,headY+15]],'#31474f',trim,.5);
      }else if(hair==='helmet'){
        path(c,[[-13,headY+5],[-13,headY-7],[0,headY-20],[13,headY-7],[13,headY+5],[7,headY],[0,headY-7],[-7,headY]],'#778e92','#d0c6a6',1);
        path(c,[[0,headY-18],[4,headY-35],[12,headY-32],[5,headY-13]],'#b35e52','#e4b195',.6);
      }else if(hair==='band'){line(c,[[-10,headY-5],[10,headY-5]],trim,3);path(c,[[9,headY-5],[19,headY-2],[26,headY+12],[18,headY+6]],trim);}
      else if(hair==='goggles'){for(const x of [-5,5])ellipse(c,x,headY-5,4,4,'#496d71','#c3b17c',1.7);}
      this.npcTool(c,tool,width,waistY,trim);
      c.restore();
    }
    npcPortrait(skin,npcId){
      this.npcPortraitCache??=new Map();const key=`${skin}:${npcId||''}`;
      if(this.npcPortraitCache.has(key))return this.npcPortraitCache.get(key);
      const canvas=document.createElement('canvas');canvas.width=240;canvas.height=280;
      const c=canvas.getContext('2d');c.translate(120,256);c.scale(2.15,2.15);
      this.npcCharacter(c,{skin,npcId,x:0,y:0});const url=canvas.toDataURL('image/png');
      this.npcPortraitCache.set(key,url);return url;
    }
    npcTool(c,tool,width,waistY,trim){
      const x=width+10,y=waistY-5;
      if(['staff','spear','halberd','rod'].includes(tool)){
        line(c,[[x+3,3],[x+3,-84]],tool==='staff'?'#8b7759':'#b0a283',3);
        if(tool==='staff'){path(c,[[x+3,-97],[x-3,-86],[x+3,-76],[x+9,-86]],'#a8c3ad','#e1d0a5',1);}
        if(tool==='spear'||tool==='halberd'){path(c,[[x+3,-103],[x-3,-87],[x+3,-79],[x+9,-87]],'#bacece','#e2e5cb',1);if(tool==='halberd')path(c,[[x+5,-91],[x+17,-91],[x+22,-77],[x+9,-79]],'#8cabb0','#d9dabe',1);}
        if(tool==='rod'){line(c,[[x+3,-84],[x+23,-103],[x+43,-106]],'#9b8965',2);line(c,[[x+43,-106],[x+52,-9]],'#d3d6bd',.6);path(c,[[x+52,-9],[x+49,-4],[x+47,-10]],null,'#aec1bd',1);}
      }else if(tool==='book'||tool==='scroll'){
        const xx=tool==='book'?x-16:-14,yy=tool==='book'?y-4:-40;
        path(c,[[xx-11,yy-8],[xx+3,yy-6],[xx+17,yy-9],[xx+16,yy+10],[xx+3,yy+13],[xx-12,yy+10]],'#e0d1ad','#796e54',1);
        line(c,[[xx+3,yy-6],[xx+3,yy+12]],'#8c987e',1);for(let i=0;i<4;i++)line(c,[[xx-7,yy-3+i*3],[xx-1,yy-2+i*3]],'#7b8b78',.7);
      }else if(tool==='basket'){
        path(c,[[-width-20,-10],[-width-24,-30],[-width-1,-30],[-width-5,-10]],'#a78658','#d9bd83',1);
        c.beginPath();c.ellipse(-width-12,-30,12,15,0,Math.PI,TAU);c.strokeStyle='#c3aa76';c.lineWidth=2;c.stroke();
        for(let i=0;i<5;i++){line(c,[[-width-21+i*4,-29],[-width-18+i*3,-12]],'#705d42',.6);path(c,[[-width-13,-28],[-width-25+i*5,-46],[-width-18+i*5,-39]],'#8da976','#bacc8a',.7);}
      }else if(tool==='hammer'){
        line(c,[[x-5,y+7],[x+12,y-17]],'#d3b287',4);path(c,[[x+5,y-20],[x+12,y-28],[x+29,y-16],[x+22,y-8]],'#748b8c','#c7c9ac',1.3);
      }else if(tool==='lute'){
        c.save();c.translate(5,-31);c.rotate(-.32);ellipse(c,0,0,11,18,'#b58e60','#edca8e',1);ellipse(c,0,1,6,11,'#d2b180');line(c,[[0,-13],[0,-48]],'#95754f',5);line(c,[[-4,-47],[7,-47]],'#ceaf7a',3);for(let i=-1;i<=1;i++)line(c,[[i*2,-46],[i*2,13]],'#f5ddb2',.55);c.restore();
      }else if(tool==='fan'){
        c.save();c.translate(x-4,y);c.rotate(-.35);path(c,[[0,0],[-18,-21],[-6,-30],[9,-29],[23,-19]],'#d4d1bd',trim,1);for(let i=0;i<5;i++)line(c,[[0,0],[-18+i*10,-20-Math.sin(i*.75)*9]],'#7e908a',.7);c.restore();
      }else if(tool==='lantern'||tool==='bottle'){
        const xx=x+2;line(c,[[xx,y],[xx,y+8]],trim,1.5);ellipse(c,xx,y+18,tool==='lantern'?9:6,12,tool==='lantern'?'#e8daa0':'#8ac1ab',trim,1);line(c,[[xx-7,y+8],[xx+7,y+8]],'#6c8473',2);if(tool==='lantern')ellipse(c,xx,y+18,17,20,'#f4deb31c');
      }else if(tool==='dagger'){
        path(c,[[x,y],[x+23,y-6],[x+4,y+5]],'#bad0cf','#f1eacb',.7);line(c,[[x+2,y-3],[x+4,y+9]],trim,2);ellipse(c,-20,-9,10,12,'#85775c','#bbab84',1);
      }else if(tool==='abacus'){
        c.save();c.translate(x-12,y-3);c.rotate(.2);c.fillStyle='#4f4d45';c.fillRect(-15,-11,30,23);c.strokeStyle='#c3a67b';c.lineWidth=2;c.strokeRect(-15,-11,30,23);for(let i=0;i<5;i++){line(c,[[-10+i*5,-8],[-10+i*5,10]],'#ae9872',.8);for(let j=0;j<3;j++)ellipse(c,-10+i*5,-5+j*6,2,2,'#cfb57e');}c.restore();
      }else if(tool==='gear'){
        c.save();c.translate(x,y);c.rotate(this.t*.3);for(let i=0;i<8;i++){c.rotate(TAU/8);c.fillStyle='#b8a06a';c.fillRect(-3,-15,6,7);}ellipse(c,0,0,11,11,'#8b8769','#cabe95',2);ellipse(c,0,0,5,5,'#45686a','#d2bd83',2);c.restore();
      }else if(tool==='beads'||tool==='rope'){
        for(let i=0;i<13;i++){const a=i*TAU/13;ellipse(c,Math.cos(a)*12,-48+Math.sin(a)*16,tool==='beads'?2.8:1.9,2.8,trim,'#725a40',.4);}
      }
    }
    sectFacilities(state){
      const positions={east:[2450,1380],south:[1770,1830],center:[1580,1090],west:[730,1370],north:[2150,610]};
      const names={garden:'灵药田',forge:'铸兵坊',library:'藏经阁'};
      const managed=state.management?.enabled?window.Xian.managementInfo?.(state):null;
      return Object.entries(state.sect?.facilities||{}).map(([id,f],index)=>{
        const p=positions[f.position]||positions.center;
        const siblings=Object.entries(state.sect.facilities).filter(([,v])=>v.position===f.position).map(([k])=>k),slot=siblings.indexOf(id);
        const detail=managed?.facilities.find(v=>v.id===id);
        return{type:'sectFacility',facilityId:id,name:names[id]||id,x:p[0]+(slot-(siblings.length-1)/2)*140,y:p[1]+(index%2)*12,scale:1,...f,...detail,managed:!!detail};
      });
    }
    sectFacility(c,o){
      const level=o.level||0,p=this.currentPlayer,near=Math.hypot(p.x-o.x,p.y-o.y)<230;
      if(p.y<o.y&&p.y>o.y-130&&Math.abs(p.x-o.x)<70)c.globalAlpha=.45;
      shadow(c,0,0,75,18,.18);
      if(!level){
        path(c,[[-61,-22],[51,-22],[67,16],[-49,16]],'#8c987d','#c5c5a4',2);
        for(const x of [-48,48]){line(c,[[x,0],[x,-45]],'#8c805c',3);line(c,[[x-6,-40],[x+6,-40]],'#d1b882',2);}
        line(c,[[-47,-39],[47,-39]],'#ab956b',2);path(c,[[-35,-8],[-16,-17],[13,-14],[32,-3],[1,3]],'#a9af97');
      }else if(o.facilityId==='garden'){
        for(let i=0;i<Math.min(3,level+1);i++)this.scenerySprite(c,{type:'garden',x:(i-1)*42,y:i%2?8:-7,scale:.92});
        line(c,[[-68,14],[-68,-22],[66,-22],[66,14]],'#bdad7c',2);
        if(level>1){line(c,[[65,-19],[65,-54]],'#7b825f',3);path(c,[[65,-55],[80,-67],[96,-55],[80,-49]],'#a7c395','#dbdfb8');}
      }else if(o.facilityId==='forge'){
        if(!this.illustrated(c,'forgeV4',166,137))this.building(c,112,72,'#536b58',false);
        path(c,[[-17,-7],[-22,-25],[-14,-46],[14,-46],[21,-25],[16,-7]],'#727f6a','#b8b995',2);
        c.fillStyle='#333e32';c.fillRect(-11,-30,23,16);
        const glow=.65+Math.sin(this.t*5)*.18;c.globalAlpha*=glow;
        path(c,[[-7,-16],[-9,-23],[-3,-34],[0,-25],[6,-31],[10,-20],[7,-16]],'#efbb72');c.globalAlpha=1;
        for(let i=0;i<level;i++)line(c,[[29+i*6,-9],[36+i*6,-39]],'#d4d5b6',2);
      }else{
        if(!this.illustrated(c,'pavilionV4',174,137))this.building(c,114,83,'#456e62',level>1,'藏经阁');
        for(let i=0;i<level+2;i++){c.fillStyle=['#bdb394','#86a79c','#c9bd8b'][i%3];c.fillRect(-28+i*12,-42,8,28);line(c,[[-26+i*12,-35],[-22+i*12,-35]],'#e9dfb9',1);}
        line(c,[[-35,-12],[36,-12]],'#798e72',4);
      }
      if(level&&o.discipleId){
        const palettes={qinghe:['#8fb6a1','#d9dec0'],yanming:['#bd9675','#ead2a6'],ruoshui:['#8bb5c0','#e0e5ce']},pal=palettes[o.discipleId]||palettes.qinghe;
        c.save();c.translate(57,21);c.scale(.65,.65);this.npcCharacter(c,{...o,npcId:o.discipleId,skin:o.discipleId});
        if(o.facilityId==='forge')line(c,[[16,-14],[22,-28-Math.sin(this.t*3)*5]],'#d5c496',3);
        else if(o.facilityId==='library'){c.fillStyle='#ddd6ad';c.fillRect(6,-18,16,13);line(c,[[14,-18],[14,-5]],'#9b9f81',1);}
        c.restore();
      }
      if(near){label(c,`${o.name} · ${level?level+'级':'待建'}`,0,-(o.facilityId==='garden'?78:145),'#ead8aa',12);
        label(c,o.stored>0?`可领取 ${o.stored} 批 · N`:o.managed?(o.resting?'弟子轮休':o.batch?'付料生产中':o.waitingReason||'[ N ] 安排订单'):'[ N ] 宗门建设',0,-(o.facilityId==='garden'?60:127),o.stored>0?'#d4ecb1':'#bfcbb3',10);
        if(o.managed&&o.batch){c.fillStyle='#29493b';c.fillRect(-41,36,82,4);c.fillStyle=o.resting?'#acb7a3':'#d3c28c';c.fillRect(-41,36,82*o.batch.progress/o.batch.duration,4);label(c,`${Math.ceil(o.batch.duration-o.batch.progress)}秒 · 疲劳 ${Math.round(o.workerFatigue)}`,0,52,'#ced5b8',10);}}
    }
    building(c,w,h,roof,ornate,sign='青云观'){
      shadow(c,0,0,w*.64,20,.2);
      const wall=c.createLinearGradient(0,-h,0,0);wall.addColorStop(0,'#9daba0');wall.addColorStop(.42,'#c5c6ac');wall.addColorStop(1,'#9dab91');
      path(c,[[-w*.43,0],[-w*.43,-h],[w*.43,-h],[w*.43,0]],wall,'#748d79');
      c.fillStyle='#5c776b';c.fillRect(-w*.17,-h*.66,w*.34,h*.66);
      c.fillStyle='#314e47';c.fillRect(-w*.135,-h*.57,w*.27,h*.57);
      for(let i=-2;i<=2;i++){const x=i*w*.061;line(c,[[x,-h*.53],[x,0]],'#a79e79',1.5);for(let j=1;j<5;j++)line(c,[[x-3,-h*.12*j],[x+3,-h*.12*j]],'#c5b58a',1);}
      for(const x of [-w*.36,w*.3]){c.fillStyle='#5d7465';c.fillRect(x,-h*.77,w*.1,h*.35);line(c,[[x+w*.05,-h*.75],[x+w*.05,-h*.45]],'#b3c09e',1);}
      const tiles=c.createLinearGradient(0,-h*1.4,0,-h*.82);tiles.addColorStop(0,'#628677');tiles.addColorStop(.55,roof);tiles.addColorStop(1,'#294d43');
      c.beginPath();c.moveTo(-w*.61,-h*1.02);c.quadraticCurveTo(-w*.5,-h*.92,-w*.36,-h*1.13);c.lineTo(0,-h*1.4);c.lineTo(w*.36,-h*1.13);c.quadraticCurveTo(w*.5,-h*.92,w*.61,-h*1.02);c.lineTo(w*.51,-h*.85);c.quadraticCurveTo(0,-h*.79,-w*.51,-h*.85);c.closePath();c.fillStyle=tiles;c.fill();c.strokeStyle='#9fb397';c.lineWidth=1.5;c.stroke();
      for(let i=-6;i<=6;i++)line(c,[[i*w*.065,-h*.9],[i*w*.041,-h*1.19]],'rgba(173,200,168,.25)',1);
      for(let i=0;i<4;i++){const y=-h*(.9+i*.07),span=w*(.49-i*.055);line(c,[[-span,y],[0,y-h*.05],[span,y]],'#a8bca333',.8);}
      line(c,[[-w*.57,-h*.92],[0,-h*.86],[w*.57,-h*.92]],'#a6bca0',2);line(c,[[-w*.22,-h*1.27],[0,-h*1.41],[w*.22,-h*1.27]],'#cfbd86',2);
      for(const x of [-w*.39,w*.39]){line(c,[[x,0],[x,-h*.83]],'#6c7158',5);line(c,[[x-1,-3],[x-1,-h*.8]],'#d0c39b',1.2);}
      if(ornate){path(c,[[-w*.33,-h*1.35],[0,-h*1.67],[w*.33,-h*1.35],[w*.24,-h*1.28],[-w*.24,-h*1.28]],tiles,'#abc4a0',2);c.fillStyle='#3c6157';c.fillRect(-24,-h*.86,48,16);label(c,sign,0,-h*.76,'#e8d4a0',11);}
      path(c,[[-w*.5,0],[-w*.56,9],[w*.56,9],[w*.5,0]],'#a5b099');
      for(let i=0;i<3;i++){const width=w*(.24+i*.025);path(c,[[-width,8+i*4],[-width-5,12+i*4],[width+5,12+i*4],[width,8+i*4]],i%2?'#c1c6a9':'#aab79c','#7c958044',.6);}
      for(const x of [-w*.4,w*.4]){line(c,[[x,-h*.88],[x,-h*.69]],'#8e6c4a',2);ellipse(c,x,-h*.57,6,9,'#c6aa6d','#e3cd93');}
    }
    human(c,robe,trim,player,t,facing,moving=false){
      const walk=moving?Math.sin(t*13):0;shadow(c,0,1,14,6,.24);
      line(c,[[-5,-3],[-6+walk*2,3]],'#243c3c',5);line(c,[[5,-3],[6-walk*2,3]],'#243c3c',5);
      // Hair and long, layered robe silhouettes remain readable at gameplay scale.
      path(c,[[-7,-35],[-11,-22],[-9,-10],[-1,-19],[9,-8],[10,-29],[5,-37]],'#1c373b');
      const cloth=c.createLinearGradient(-14,-24,17,3);cloth.addColorStop(0,trim);cloth.addColorStop(.27,robe);cloth.addColorStop(.77,robe);cloth.addColorStop(1,'#335347');
      c.beginPath();c.moveTo(-7,-25);c.quadraticCurveTo(-15,-24,-20,-9);c.lineTo(-14,-5);c.lineTo(-8,-17);c.quadraticCurveTo(-7,-9,-16,0);c.quadraticCurveTo(-4,6,0,2);c.quadraticCurveTo(10,6,16,0);c.lineTo(8,-17);c.lineTo(17,-5);c.lineTo(22,-10);c.quadraticCurveTo(15,-24,7,-25);c.closePath();c.fillStyle=cloth;c.fill();c.strokeStyle='#294c40';c.lineWidth=.8;c.stroke();
      path(c,[[-3,-24],[-6,-8],[-7,1],[0,3],[6,-2],[3,-24]],trim,'#b9c6a166',.6);
      line(c,[[-6,-24],[1,-17],[7,-24]],'#e8e0ba',1.2);line(c,[[-8,-11],[9,-11]],'#d4b479',2.3);ellipse(c,2,-11,2.5,2,'#e4c891');
      for(const x of [-10,-6,8,12])line(c,[[x*.6,-9],[x,0]],'#d6dfba55',.65);
      line(c,[[-18,-9],[-14,-6]],trim,2);line(c,[[17,-7],[20,-10]],trim,2);ellipse(c,-16,-4,2,2.5,'#dbc4a2');ellipse(c,20,-6,2,2.5,'#dbc4a2');
      ellipse(c,0,-29,6.5,8,'#e0c7a1');path(c,[[-7,-30],[-6,-36],[0,-40],[6,-36],[7,-28],[2,-33]],'#1c373b');ellipse(c,1,-40,4,3,'#1c373b');line(c,[[-5,-39],[7,-39]],'#c9b478',1.5);
      line(c,[[-3.5,-29],[-1.5,-29]],'#475248',.8);line(c,[[2,-29],[4,-29]],'#475248',.8);line(c,[[0,-26],[2,-26]],'#a67f65',.5);
      if(player){
        const a=facing||0;c.save();c.translate(11,-14);c.rotate(a+.65);
        path(c,[[0,1],[-2,-34],[0,-43],[3,-34],[3,1]],'#e9edca','#78b2a4');line(c,[[-6,1],[8,1]],'#dbbf7f',3);line(c,[[1,1],[1,9]],'#4a6560',3);c.restore();
        const scarf=Math.sin(t*3)*4;path(c,[[-2,-23],[-20,-19],[-29,-10+scarf],[-18,-13],[-2,-20]],'#dde8c3');
      }
    }
    player(c,p,state){
      c.save();c.translate(p.x,p.y);
      const medicine=state.workshop?.medicineBuffs||{};
      if((p.shield||0)>0||medicine.ward||state.buffs?.some(b=>b.id==='shield'||b.id==='ward'||b.type==='ward')){ellipse(c,0,-24,33,40,null,'#e5ce96bb',2);ellipse(c,0,1,35,13,null,'#e5ce9677',1);}
      if(medicine.rage){for(let i=0;i<4;i++){const a=this.t*2+i*TAU/4;line(c,[[Math.cos(a)*23,Math.sin(a)*9],[Math.cos(a)*26,Math.sin(a)*9-12]],'#ffc99488',2);}}
      if(medicine.insight){for(let i=0;i<5;i++){const a=-this.t+i*TAU/5;ellipse(c,Math.cos(a)*29,Math.sin(a)*15-22,1.5,1.5,'#c3e6ff');}}
      if(p.invuln>0){ellipse(c,0,-15,22,27,null,'rgba(170,239,213,.65)',1.5);c.globalAlpha=.72+.28*Math.sin(this.t*30);}
      if(p.dashCd>0&&p.invuln>0){for(let i=1;i<4;i++){c.globalAlpha=.13;ellipse(c,-Math.cos(p.facing||0)*i*12,-Math.sin(p.facing||0)*i*12-14,10,21,'#ccebdc');}c.globalAlpha=1;}
      const weapon=window.Xian.weaponInfo?.(state),weaponType=weapon?.kind||weapon?.weaponKind||weapon?.type||window.Xian.CONTENT?.ITEMS?.[state.equipment?.weapon]?.weaponKind||'sword';
      const newSprite=`player-${weaponType}V4`,sprite=this.sprites[newSprite]||this.sprites[weaponType==='bow'?'cultivatorBow':weaponType==='staff'?'cultivatorStaff':'cultivator'];
      if(sprite){
        shadow(c,0,1,17,6,.23);
        const moving=p.moving||p.isMoving,bob=moving?Math.sin(this.t*13)*1.5:Math.sin(this.t*2)*.5;
        c.save();c.scale(Math.cos(p.facing||0)<0?-1:1,1);c.rotate(moving?Math.sin(this.t*13)*.02:0);
        c.translate(0,bob);if(this.sprites[newSprite]){c.rotate(p.attackCd>.2?Math.sin(p.attackCd*18)*.025:0);this.illustrated(c,newSprite,75,96,1);}else c.drawImage(sprite,-40,-73,80,80);c.restore();
      }else this.human(c,'#e6e4c8','#487c74',true,this.t,p.facing,p.moving||p.isMoving);
      if(state.dead){c.globalAlpha=.5;ellipse(c,0,-20,21,26,'#728787');}c.restore();
    }
    enemy(c,e,p){
      c.save();c.translate(e.x,e.y);const boss=e.boss||['wolfKing','ancientTree','guardian'].includes(e.type), gated=e.gated;
      const skin=e.skin||e.archetype||e.type,element=e.element||'metal';
      const body=e.bodyKind||({flameWolf:'fireLizard',flameSpirit:'flameImp',lavaGolem:'furnace',iceWolf:'stag',iceSpirit:'foxSpirit',iceGolem:'iceConstruct',flameLord:'furnace',infernoIdol:'furnace',iceSovereign:'iceConstruct',gutterRat:'rat',streetBandit:'bandit',inkWraith:'scroll',reefCrab:'crab',tideSiren:'siren',brineSerpent:'serpent',sandScorpion:'scorpion',tombSentinel:'sentinel',graveMoth:'moth',cloudRoc:'roc',prismConstruct:'prism',stormEye:'storm'})[e.type];
      if(gated)c.globalAlpha=.6;
      const bob=Math.sin(this.t*4+(typeof e.id==='number'?e.id:0))*2;
      if(e.hit>0){c.shadowColor='#ffefd3';c.shadowBlur=15;}
      const image=e.type==='frostWyrm'?'dragonV4':skin==='ancientTree'?'ancient-treeV4':skin==='wolf'||skin==='wolfKing'?'wolfV4':skin==='spirit'?'spiritV4':skin==='guardian'||e.type==='guardian'?'guardianV4':'golemV4';
      if(body){if(boss){c.save();c.scale(1.45,1.45);this.worldEnemy(c,e,p,body);c.restore();}else this.worldEnemy(c,e,p,body);}
      else if(this.sprites[image]){
        const size=boss?(image==='dragonV4'?170:140):skin==='wolf'?77:87;
        shadow(c,0,2,size*.3,size*.11,.24);c.save();if(p.x<e.x)c.scale(-1,1);
        const moving=e.mode==='chase',stride=moving?Math.sin(this.t*(skin==='wolf'?13:8)+e.x)*2:Math.sin(this.t*3+e.x)*.6;
        c.translate(0,stride);c.rotate(moving?Math.sin(this.t*8)*.015:e.mode==='windup'?Math.sin(this.t*15)*.035:0);
        if(element==='fire')c.filter='sepia(.6) saturate(1.5) hue-rotate(335deg)';else if(element==='ice')c.filter='saturate(.5) brightness(1.15)';else if(element==='thunder')c.filter='hue-rotate(50deg)';
        this.illustrated(c,image,size,size*1.12,skin==='wolf'?.88:.98);c.restore();
        if(e.hit>0){c.globalAlpha=e.hit*.5;const glow=c.createRadialGradient(0,-size*.4,2,0,-size*.4,size*.4);glow.addColorStop(0,'#fff3c499');glow.addColorStop(1,'#fff3c400');ellipse(c,0,-size*.4,size*.4,size*.45,glow);}
      }else if(skin==='wolf'||skin==='wolfKing'){
        const fire=element==='fire',ice=element==='ice',coat=fire?'#b46c43':ice?'#a8d0dc':boss?'#bacbcb':'#aeb196',mane=fire?'#df9a57':ice?'#e2edf1':boss?'#cfdddd':'#c5c4a7',dark=fire?'#784c38':ice?'#6f9eb5':boss?'#94b1b5':'#899780';
        const s=boss?1.9:1;c.scale(s,s);shadow(c,0,0,18,7);
        const facing=p.x<e.x?-1:1;c.scale(facing,1);
        path(c,[[-15,-9],[-23,-18],[-22,-6],[-14,-3]],dark);
        line(c,[[-8,-8],[-10,2]],dark,4);line(c,[[10,-8],[13,1]],dark,4);
        ellipse(c,0,-11+bob*.3,17,10,coat);ellipse(c,14,-15+bob*.3,9,8,mane);
        path(c,[[10,-19],[8,-28],[15,-23],[18,-25],[23,-19]],dark);path(c,[[17,-15],[27,-11],[23,-7],[17,-8]],coat);ellipse(c,18,-16,1.8,1.3,ice?'#b7f0ff':fire?'#ffd19a':boss?'#edbd6e':'#dcbd67');
        if(fire){path(c,[[-10,-19],[-12,-28],[-5,-23],[-1,-31],[5,-20]],'#eba55f');line(c,[[-9,-9],[-2,-12],[5,-9]],'#f5ba73',1.5);}
        if(ice){path(c,[[-10,-18],[-9,-29],[-4,-21],[2,-28],[6,-19]],'#d1eaf4');line(c,[[-10,-11],[6,-11]],'#78b6d4',1.5);}
        if(boss){path(c,[[-12,-17],[-8,-29],[-2,-23],[3,-31],[7,-21],[11,-25],[14,-15]],ice?'#eef9ff':'#dae5dc');line(c,[[-6,-22],[3,-25],[9,-19]],ice?'#71b8d7':'#699eab',2);if(e.type==='frostWyrm'){line(c,[[10,-24],[13,-38],[18,-42]],'#dff6ff',2);path(c,[[-17,-9],[-32,-11],[-38,-22],[-27,-17],[-21,-17]],'#b9dce9');}}
      }else if(skin==='spirit'){
        if(boss)c.scale(1.75,1.75);
        const fire=element==='fire',ice=element==='ice',body=fire?'#cd8050':ice?'#8dbdd5':'#75b8a3',edge=fire?'#ffd09a':ice?'#d9f3ff':'#b9e4c5',glow=ELEMENT_COLORS[element]||'#8ee4c3';
        shadow(c,0,0,17,6,.13);const g=c.createRadialGradient(0,-22,1,0,-22,35);g.addColorStop(0,glow+'73');g.addColorStop(1,glow+'00');ellipse(c,0,-22,35,35,g);
        path(c,[[0,-47+bob],[-15,-31+bob],[-14,-17+bob],[-7,-7+bob],[0,-12+bob],[8,-4+bob],[16,-21+bob],[9,-36+bob]],body,edge,1);ellipse(c,-4,-28+bob,2,2,'#eff2ce');ellipse(c,5,-28+bob,2,2,'#eff2ce');
        if(boss){path(c,[[-9,-42+bob],[-14,-55+bob],[-4,-49+bob],[0,-61+bob],[5,-49+bob],[14,-55+bob],[9,-42+bob]],edge);line(c,[[-9,-21+bob],[0,-26+bob],[9,-21+bob]],edge,1);}
      }else if(skin==='ancientTree'){
        shadow(c,0,0,49,18,.23);path(c,[[-24,2],[-36,7],[-28,-20],[-18,-58],[18,-58],[27,-19],[41,9],[18,2],[8,-11],[-6,-9]],'#596f56','#99ab78',2);
        line(c,[[-20,-44],[-47,-56],[-53,-39]],'#596f56',12);line(c,[[20,-44],[44,-62],[58,-52]],'#596f56',12);
        for(let i=0;i<5;i++)ellipse(c,Math.cos(i*1.3)*31,-65+Math.sin(i*1.3)*14,29,24,i%2?'#4e8b65':'#659b70','#8cac7b');
        path(c,[[-15,-37],[-4,-33],[-12,-29]],'#f2d37d');path(c,[[15,-37],[4,-33],[12,-29]],'#f2d37d');line(c,[[-7,-20],[0,-23],[7,-20]],'#263f33',3);
        for(let i=0;i<4;i++)ellipse(c,Math.cos(this.t+i*2)*42,-45+Math.sin(this.t+i*2)*25,2,3,'#d8ce82');
      }else{
        const s=boss?1.75:1;c.scale(s,s);shadow(c,0,0,19,8,.2);
        const col=element==='fire'?'#77564b':element==='ice'?'#9cbdd0':boss?'#a8afa2':'#7c9589',gold=ELEMENT_COLORS[element]||'#b3c19b';
        line(c,[[-9,-10],[-11,2]],'#536e68',10);line(c,[[9,-10],[11,2]],'#536e68',10);
        path(c,[[-16,-35],[-17,-12],[0,-7],[17,-12],[16,-35],[0,-41]],col,'#4d6d64',2);path(c,[[-18,-34],[-26,-30],[-22,-11],[-16,-15]],col);path(c,[[18,-34],[26,-30],[22,-11],[16,-15]],col);
        path(c,[[-9,-47],[-11,-37],[0,-31],[11,-37],[9,-47]],'#b3beb0','#5c756c',1);line(c,[[-6,-41],[6,-41]],gold,3);path(c,[[0,-29],[6,-21],[0,-14],[-6,-21]],gold);
        if(boss){path(c,[[-12,-47],[-17,-57],[-6,-51],[0,-60],[6,-51],[17,-57],[12,-47]],gold);line(c,[[25,-10],[27,-56]],gold,3);path(c,[[27,-58],[21,-46],[27,-39],[34,-47]],'#e3d2a5');}
      }
      c.restore();
      const distance=Math.hypot(p.x-e.x,p.y-e.y);
      if(e.hp<e.maxHp||boss||distance<110){
        const width=boss?92:50,size=body?({rat:45,bandit:85,scroll:97,crab:66,siren:109,serpent:106,scorpion:82,sentinel:110,moth:88,roc:100,prism:98,storm:96,fireLizard:53,flameImp:91,furnace:104,stag:108,foxSpirit:95,iceConstruct:112}[body]||95)*(boss?1.45:1):this.sprites[image]?(boss?(image==='dragonV4'?170:140):skin==='wolf'?77:87):boss?98:55,y=e.y-size*1.12-12;
        label(c,e.name||'',e.x,y-12,boss?'#f2d69d':'#e9e5c8',boss?12:10);
        c.fillStyle='#203c37';c.fillRect(e.x-width/2,y,width,4);c.fillStyle=boss?'#d0a569':'#bfbb87';c.fillRect(e.x-width/2,y,width*Math.max(0,e.hp/e.maxHp),4);
        if(gated)label(c,'境界未至 · 暂不可挑战',e.x,y+15,'#d9d3b1',10);
      }
      if(e.telegraph>0&&!body){ellipse(c,e.x,e.y,Math.max(32,e.radius||30)*1.8,Math.max(32,e.radius||30)*1.2,null,'rgba(242,148,103,.75)',2);}
      if((e.burn||0)>0||(e.burnTime||0)>0)label(c,'灼',e.x-18,e.y-55,'#ffba7f',11);
      if((e.slow||0)>0||(e.slowTime||0)>0)label(c,'寒',e.x+18,e.y-55,'#b5e6f2',11);
      if((e.rooted||0)>0)ellipse(c,e.x,e.y,30,13,null,'#a0d68b',2);
    }
    worldEnemy(c,e,p,body){
      const moving=e.mode==='chase',windup=e.mode==='windup',t=this.t,beat=Math.sin(t*(moving?12:3)+e.x*.02),face=p.x<e.x?-1:1;
      const gradient=(a,b,y0=-70,y1=0)=>{const g=c.createLinearGradient(-20,y0,25,y1);g.addColorStop(0,a);g.addColorStop(1,b);return g;};
      c.save();c.lineJoin='round';c.lineCap='round';shadow(c,0,2,body==='roc'?44:body==='rat'?28:38,11,body==='moth'?.12:.23);
      if(['fireLizard','flameImp','furnace','stag','foxSpirit','iceConstruct'].includes(body)){
        this.regionalEnemy(c,e,p,body);
      }else if(body==='bandit'){
        c.scale(face,1);c.rotate(windup?-.13:beat*.008);c.translate(0,moving?beat*1.4:0);
        this.npcCharacter(c,{skin:'thief',x:e.x});
        path(c,[[-24,-32],[-11,-47],[-5,-32],[-9,-8],[-30,-4]],'#594648','#9e7b61',1);
        line(c,[[24,-25],[46,-55]],'#adbbb6',5);path(c,[[45,-55],[61,-70],[56,-46],[33,-18]],'#cdd5c5','#ede4c3',1);
        path(c,[[-17,-57],[-5,-59],[1,-56],[-5,-54],[-16,-54]],'#c17967');
      }else if(body==='rat'){
        c.scale(face,1);c.translate(0,moving?beat*.8:0);
        c.beginPath();c.moveTo(-18,-10);c.bezierCurveTo(-45,-2,-57,-19,-44,-31);c.strokeStyle='#a79484';c.lineWidth=4;c.stroke();c.strokeStyle='#dbb5a0';c.lineWidth=1;c.stroke();
        for(const x of [-14,14])line(c,[[x,-9],[x+beat*2,2],[x+9,2]],'#877365',5);
        ellipse(c,-1,-18,27,15,gradient('#98978c','#4a5959',-40,5),'#bac0a9',1);
        path(c,[[15,-30],[38,-20],[47,-13],[38,-7],[20,-8]],'#868c82','#bac0a9',1);ellipse(c,19,-30,8,11,'#a49d90','#cfb9a0',1);ellipse(c,19,-30,4,7,'#ae8079');
        ellipse(c,35,-18,2.5,2.5,'#f1c477');ellipse(c,47,-13,3,2,'#584f4b');for(const dy of [-4,0,4])line(c,[[39,-11],[58,-14+dy*2]],'#c2c4ae',.6);
        for(let i=0;i<6;i++)line(c,[[-21+i*6,-24],[-19+i*6,-29]],'#bec0a855',1);
      }else if(body==='scroll'){
        const bob=Math.sin(t*2.8+e.x)*4;c.translate(0,bob);
        for(const side of [-1,1]){c.beginPath();c.moveTo(side*14,-19);c.bezierCurveTo(side*35,-35,side*53,-66+beat*8,side*37,-78);c.strokeStyle='#314e5799';c.lineWidth=9;c.stroke();c.strokeStyle='#95aaa077';c.lineWidth=1;c.stroke();}
        const paper=gradient('#e0d6b9','#99a493',-92,-15);path(c,[[-23,-94],[24,-94],[17,-73],[23,-47],[13,-27],[21,-13],[0,-20],[-21,-13],[-17,-37],[-24,-59],[-17,-75]],paper,'#d7d1b2',1.4);
        for(const yy of [-94,-17]){line(c,[[-29,yy],[29,yy]],'#7d785e',5);ellipse(c,-29,yy,3,4,'#c7b186');ellipse(c,29,yy,3,4,'#c7b186');}
        path(c,[[-13,-71],[-3,-64],[-10,-59]],'#31515a');path(c,[[13,-71],[3,-64],[10,-59]],'#31515a');line(c,[[-6,-46],[0,-52],[8,-43],[-1,-37]],'#637166',2);
        for(let i=0;i<6;i++){const a=i*1.7+t*.4;path(c,[[Math.cos(a)*36,-54+Math.sin(a)*40],[Math.cos(a)*39+3,-45+Math.sin(a)*40],[Math.cos(a)*37-2,-40+Math.sin(a)*40]],'#4a666088');}
      }else if(body==='crab'){
        for(const side of [-1,1])for(let i=0;i<4;i++)line(c,[[side*17,-21],[side*(33+i*4),-20+i*7],[side*(43+i*5),-3+i*2+beat*(i%2?1:-1)]],'#628b8c',5);
        ellipse(c,0,-27,34,24,gradient('#94aca3','#3e777e',-55,0),'#c5cbb0',1.5);
        path(c,[[-24,-39],[-13,-55],[-7,-47],[2,-59],[9,-47],[18,-53],[26,-37]],'#89a89e','#c0cbb0',1);
        for(const side of [-1,1]){const y=windup?-52:-28;line(c,[[side*24,-32],[side*41,y],[side*50,y-7]],'#779f9b',7);c.save();c.translate(side*53,y-8);c.scale(side,1);path(c,[[-7,-10],[4,-23],[20,-18],[6,-10],[21,-5],[13,8],[-3,8]],gradient('#b7bf9d','#4e8b8c',-25,10),'#cfccb0',1.2);c.restore();line(c,[[side*9,-42],[side*13,-59]],'#598686',3);ellipse(c,side*13,-60,3,3,'#f3d99e');}
        line(c,[[-18,-28],[0,-37],[18,-28]],'#bbd2bd',1.3);
      }else if(body==='siren'){
        c.scale(face,1);c.translate(0,beat*1.5);
        const tail=gradient('#8daab7','#465e86',-40,0);path(c,[[-15,-48],[-24,-20],[-5,-4],[15,-13],[34,-4],[57,-21],[43,-22],[39,-40],[22,-23],[7,-26],[16,-49]],tail,'#b2c8c4',1.2);
        for(let i=0;i<6;i++)line(c,[[-9+i*5,-23],[1+i*5,-17]],'#b2c8bf66',1);
        path(c,[[-12,-83],[-24,-65],[-24,-36],[-9,-44],[12,-39],[20,-66],[10,-84]],'#b6c9bb','#dfe1c7',1);
        path(c,[[-15,-81],[-31,-62],[-47,-54],[-48,-47],[-29,-50],[-10,-68]],'#91b8b3','#cddcd0',1);
        path(c,[[12,-81],[26,-63],[38,-72],[40,-63],[24,-50],[8,-67]],'#91b8b3','#cddcd0',1);
        ellipse(c,0,-91,10,13,'#c8d8c8','#e3e6d2',.8);path(c,[[-11,-83],[-16,-103],[-3,-117],[11,-107],[19,-87],[29,-68],[16,-67],[7,-102],[-3,-97]],'#4e6984','#9bb9bd',1);
        for(const side of [-1,1])path(c,[[side*9,-103],[side*19,-115],[side*17,-96]],'#90b9ba','#d1ded0',1);
        line(c,[[-6,-92],[-3,-91]],'#566273',1);line(c,[[3,-91],[6,-92]],'#566273',1);
        if(windup)for(let i=0;i<3;i++){c.beginPath();c.arc(39,-77,12+i*8,-.7,.7);c.strokeStyle='#d4e8cf';c.lineWidth=1;c.stroke();}
      }else if(body==='serpent'){
        c.scale(face,1);const sway=Math.sin(t*2)*6;
        const coil=gradient('#a6b8a1','#3b7777',-100,5);c.beginPath();c.moveTo(-42,-8);c.bezierCurveTo(-20,12,51,7,40,-25);c.bezierCurveTo(28,-47,-28,-21,-23,-57);c.bezierCurveTo(-21,-84,22+sway,-58,12+sway,-90);c.strokeStyle='#c8d1b1';c.lineWidth=21;c.stroke();c.strokeStyle=coil;c.lineWidth=18;c.stroke();
        for(let i=0;i<6;i++){const x=-29+i*11;line(c,[[x,-2],[x+5,-8]],'#c2cbac66',1);}
        path(c,[[4+sway,-90],[5+sway,-111],[25+sway,-111],[39+sway,-99],[29+sway,-87],[12+sway,-84]],coil,'#cad4b4',1.3);
        path(c,[[8+sway,-104],[-4+sway,-118],[4+sway,-89]],'#80aa9c','#c2d1b0',1);ellipse(c,27+sway,-100,2.6,2.2,'#ecd287');line(c,[[34+sway,-93],[47+sway,-91],[52+sway,-95]],'#bc8e7a',1.4);
      }else if(body==='scorpion'){
        c.scale(face,1);for(const side of [-1,1])for(let i=0;i<4;i++)line(c,[[side*12,-25],[side*(29+i*3),-26+i*8],[side*(36+i*3),2+beat*(i%2?1:-1)]],'#a88c67',4);
        ellipse(c,0,-23,25,18,gradient('#c0a779','#6d6154',-50,0),'#d4bb8a',1.2);
        for(let i=0;i<5;i++)line(c,[[-20+i*8,-35],[-22+i*8,-13]],'#5e594c',2);
        c.beginPath();c.moveTo(-16,-29);c.bezierCurveTo(-48,-38,-50,-87,-22,-94);c.bezierCurveTo(-3,-100,10,-77,0,-62);c.strokeStyle='#c4a374';c.lineWidth=10;c.stroke();
        for(let i=0;i<5;i++)ellipse(c,-39+Math.sin(i*.8)*16,-39-i*11,5,5,'#a18a65','#d0b589',.7);
        path(c,[[0,-71],[9,-59],[1,-47],[-3,-58]],'#8cb6a2','#d8dec0',1);
        for(const side of [-1,1]){line(c,[[12,side*11-22],[35,side*23-20]],'#aa8b62',6);path(c,[[33,side*23-23],[46,side*23-32],[53,side*23-25],[44,side*23-21],[54,side*23-15],[41,side*23-11]],'#b69c71','#e0c69a',1);}
        ellipse(c,17,-30,2,2,'#cbe3bb');ellipse(c,17,-19,2,2,'#cbe3bb');
      }else if(body==='sentinel'){
        c.scale(face,1);c.translate(0,moving?beat:0);
        for(const x of [-13,13]){path(c,[[x-7,0],[x-7,-30],[x+7,-30],[x+9,0]],'#60676a','#b5b199',1.2);line(c,[[x-5,-15],[x+6,-15]],'#a4a48b',2);}
        path(c,[[-29,-75],[-25,-27],[0,-20],[25,-27],[29,-75],[0,-91]],gradient('#b2afa0','#656f73',-95,0),'#c8c3a5',1.5);
        for(let row=0;row<4;row++)for(let col=-2;col<=2;col++){const x=col*9,y=-66+row*9;path(c,[[x-4,y],[x+4,y],[x+4,y+6],[x,y+9],[x-4,y+6]],'#7e8988','#b3b39a',.6);}
        path(c,[[-15,-110],[-18,-88],[0,-81],[18,-88],[15,-110]],'#a6ada1','#d2c7a5',1.2);path(c,[[-19,-109],[0,-125],[19,-109],[7,-106],[0,-113],[-7,-106]],'#6f7e7d','#c4b995',1.2);line(c,[[-10,-95],[10,-95]],'#e6c37e',3);
        path(c,[[-26,-74],[-48,-68],[-45,-18],[-24,-10],[-11,-25],[-15,-63]],'#5d7276','#c7b77f',2);path(c,[[-33,-59],[-41,-37],[-30,-20],[-19,-39]],null,'#bdb28e',1.2);
        line(c,[[35,0],[35,-107]],'#9d987e',4);path(c,[[35,-126],[26,-108],[35,-98],[44,-108]],'#a5b9b7','#e2d7b2',1.3);
      }else if(body==='moth'){
        const flap=.78+Math.sin(t*8)*.2;c.translate(0,-45+beat*3);
        for(const side of [-1,1]){c.save();c.scale(side*flap,1);path(c,[[0,-8],[27,-47],[55,-43],[63,-19],[34,3],[57,21],[39,37],[13,25],[0,7]],gradient('#c9bea4','#6b7b81',-45,35),'#ded1b2',1.3);path(c,[[10,-6],[29,-29],[45,-25],[30,-11]],'#6b6f79','#aaaca2',1);ellipse(c,36,-23,7,6,'#c8b082','#5d6570',2);ellipse(c,36,-23,2,3,'#eef2cb');line(c,[[8,9],[38,27]],'#dbd6b780',1);c.restore();}
        ellipse(c,0,0,7,27,gradient('#c6c3ae','#62676a',-25,25),'#ded6b9',1);for(let i=0;i<5;i++)line(c,[[-5,-5+i*6],[5,-5+i*6]],'#767c73',1);
        line(c,[[-3,-22],[-11,-38],[-19,-42]],'#d2d1b5',1.5);line(c,[[3,-22],[11,-38],[19,-42]],'#d2d1b5',1.5);ellipse(c,-3,-21,2,2,'#c0e0be');ellipse(c,3,-21,2,2,'#c0e0be');
      }else if(body==='roc'){
        c.scale(face,1);c.translate(0,-24+beat*2);const flap=Math.sin(t*(windup?10:4))*.15;
        for(const side of [-1,1]){c.save();c.rotate(side*flap);path(c,[[side*8,-46],[side*43,-80],[side*81,-94],[side*70,-72],[side*56,-65],[side*65,-64],[side*47,-46],[side*52,-44],[side*30,-28],[side*12,-25]],gradient('#c1d1c6','#5a7c8f',-90,0),'#d3dcca',1.2);for(let i=0;i<5;i++)line(c,[[side*(20+i*8),-44-i*7],[side*(44+i*8),-55-i*7]],'#e3e6ca66',1);c.restore();}
        path(c,[[-12,-38],[-21,15],[-7,8],[0,25],[8,8],[20,15],[10,-39]],'#799aa3','#ccd5bd',1.2);ellipse(c,0,-36,16,26,gradient('#d6d8be','#638895',-67,0),'#d5dec7',1.2);
        path(c,[[3,-56],[8,-77],[20,-85],[33,-73],[35,-60],[21,-57]],'#c9d2ba','#edf0d3',1);path(c,[[31,-75],[47,-68],[34,-64]],'#c6ac70','#f0d99b',1);ellipse(c,26,-74,2.6,2.3,'#d4a764');path(c,[[13,-79],[5,-90],[17,-87],[19,-97],[25,-86]],'#a5c4bc','#e2e5c7',1);
        for(const x of [-8,9])line(c,[[x,-16],[x+4,-3],[x+11,-1]],'#ccb27b',2.7);
      }else if(body==='prism'){
        c.translate(0,-47+Math.sin(t*2)*5);const turn=t*.5;
        for(let i=0;i<5;i++){const a=turn+i*TAU/5,x=Math.cos(a)*42,y=Math.sin(a)*23;c.save();c.translate(x,y);c.rotate(a*.6);path(c,[[0,-20],[-8,0],[0,17],[9,0]],gradient('#d7dbc6','#7593ac',-20,20),'#e4dfb7',1.2);line(c,[[0,-18],[0,14]],'#b2d5d3',1);c.restore();}
        path(c,[[0,-58],[-23,-20],[-18,21],[0,39],[19,21],[24,-20]],'#7896a8','#e3ddbb',1.5);path(c,[[0,-58],[0,39],[24,-20]],'#b2c9c5');path(c,[[-23,-20],[0,-5],[24,-20]],null,'#f1e6b8',1.8);
        path(c,[[0,-23],[-9,-6],[0,10],[9,-6]],'#e1d69e','#f5eac3',1);if(windup){line(c,[[-26,19],[26,-25]],'#f1d797',2);line(c,[[-24,-24],[25,18]],'#f1d797',2);}
      }else if(body==='storm'){
        c.translate(0,-48+beat*3);for(let i=0;i<12;i++){const a=t*.55+i*TAU/12,x=Math.cos(a)*(25+i%3*5),y=Math.sin(a)*(21+i%2*8);ellipse(c,x,y,18+i%4,14+i%3,gradient('#a9acbb','#536780',-40,40),'#b2c1c055',.8);}
        ellipse(c,0,-2,24,15,'#b8c8c5','#e3dfbb',1.4);ellipse(c,0,-2,10,13,'#777eac','#d5cdf0',1);ellipse(c,0,-2,3,10,'#e5d8fc');
        for(let i=0;i<4;i++){const a=i*TAU/4+t*.7,x=Math.cos(a)*37,y=Math.sin(a)*33;line(c,[[x,y],[x*1.35+4,y*1.2-8],[x*1.05-3,y*1.5],[x*1.6,y*1.45]],'#dbc9f5',windup?2.5:1.3);}
        path(c,[[-23,20],[-12,40],[0,47],[6,33],[20,22],[6,29],[-4,34]],'#8298ad88');
      }
      c.restore();
    }
    regionalEnemy(c,e,p,body){
      const t=this.t,beat=Math.sin(t*(e.mode==='chase'?12:3)+e.x*.03),face=p.x<e.x?-1:1;c.save();c.scale(face,1);
      const hot=c.createLinearGradient(-20,-100,20,0);hot.addColorStop(0,'#bf9a6e');hot.addColorStop(.5,'#926b52');hot.addColorStop(1,'#4e5150');
      const ice=c.createLinearGradient(-20,-95,25,0);ice.addColorStop(0,'#dae6d8');ice.addColorStop(.48,'#9bbfc6');ice.addColorStop(1,'#527f97');
      if(body==='fireLizard'){
        c.beginPath();c.moveTo(-20,-14);c.bezierCurveTo(-43,-16,-63,-39,-61,-52);c.bezierCurveTo(-49,-34,-30,-32,-14,-27);c.fillStyle='#a77554';c.fill();
        for(const side of [-1,1])for(const x of [-16,17])line(c,[[x,-18],[x+side*6,-5],[x+side*16,1+beat*.7]],'#91694e',6);
        ellipse(c,0,-26,33,13,hot,'#c2a477',1.2);path(c,[[21,-36],[46,-26],[48,-17],[32,-12],[15,-24]],'#b78a5e','#dec18c',1);
        for(let i=0;i<8;i++){const x=-27+i*7,h=8+Math.sin(i)*5;path(c,[[x,-33],[x+1,-44-h],[x+7,-32]],'#d9985e','#f0c387',.8);}
        for(let i=0;i<13;i++)ellipse(c,-23+i%6*9,-28+Math.floor(i/6)*4,2,1.5,'#dca87477');ellipse(c,38,-27,3,2,'#f5dc91');line(c,[[40,-18],[51,-16],[57,-19]],'#d49a69',1.5);
      }else if(body==='flameImp'){
        const sway=beat*3;c.translate(0,-5+sway);
        path(c,[[-7,-6],[-18,-25],[-19,-49],[-4,-69],[14,-60],[24,-38],[14,-13],[2,-19]],'#c28754','#efd296',1.2);
        path(c,[[-17,-37],[-36,-54],[-25,-69],[-30,-53],[-9,-54]],'#c19568','#efce8f',1);path(c,[[17,-37],[37,-48],[27,-68],[31,-49],[11,-56]],'#c19568','#efce8f',1);
        path(c,[[-15,-59],[-24,-92],[-4,-78],[4,-103],[15,-75],[29,-89],[18,-56]],'#b97a4d','#e9bb7d',1.2);
        path(c,[[-12,-60],[-10,-76],[4,-88],[14,-70],[11,-56],[0,-51]],'#514e49','#f7d58a',1);line(c,[[-8,-66],[-2,-63]],'#ffdb8b',2);line(c,[[5,-63],[11,-66]],'#ffdb8b',2);
        const g=c.createRadialGradient(0,-35,0,0,-35,23);g.addColorStop(0,'#efc88866');g.addColorStop(1,'#efc88800');ellipse(c,0,-35,23,25,g);path(c,[[0,-48],[-7,-31],[1,-24],[9,-33],[5,-42]],'#f8df9f');
      }else if(body==='furnace'){
        for(const x of [-19,19]){line(c,[[x,-20],[x*1.2,-2]],'#4c5d5c',12);ellipse(c,x*1.2,0,12,5,'#85928a','#b7b69a',1);}
        path(c,[[-37,-80],[-33,-28],[-17,-11],[20,-11],[34,-27],[37,-80]],hot,'#bdb593',2);ellipse(c,0,-81,37,13,'#596561','#b9b395',2);
        path(c,[[-24,-21],[-26,-55],[26,-55],[24,-21]],'#343c3e','#b39b6e',3);
        for(let i=0;i<5;i++){const x=-18+i*9,h=15+Math.sin(t*5+i)*8;path(c,[[x-4,-24],[x-4,-33],[x,-35-h],[x+7,-33],[x+4,-23]],i%2?'#e4a56c':'#f3cc87');}
        for(const x of [-13,0,13])line(c,[[x,-54],[x,-23]],'#748179',3);
        for(const side of [-1,1]){line(c,[[side*33,-66],[side*48,-45],[side*44,-20]],'#667773',11);path(c,[[side*43-10,-22],[side*43-10,-5],[side*43+10,-5],[side*43+10,-22]],'#969580','#c0b88d',1);path(c,[[side*23-7,-80],[side*23-7,-106],[side*23+7,-106],[side*23+7,-80]],'#747e70','#c3ba94',1);ellipse(c,side*23,-106,7,3,'#3c4746');}
        path(c,[[-12,-82],[-13,-100],[0,-110],[13,-100],[12,-82]],'#9eaa95','#d0c9a1',1.2);line(c,[[-8,-95],[-2,-91]],'#e8bd78',2);line(c,[[2,-91],[8,-95]],'#e8bd78',2);
        for(let i=0;i<4;i++){const y=-110-i*9+Math.sin(t+i)*3;ellipse(c,i%2?24:-23,y,6+i*2,5+i*2,'#8a93832c');}
      }else if(body==='stag'){
        for(const x of [-19,16])for(const side of [-1,1]){const stride=beat*(x<0?1:-1)*side*3;line(c,[[x,-26],[x+stride,-12],[x+stride+side*3,1]],side>0?'#8baebb':'#608496',4);}
        ellipse(c,-1,-38,29,16,ice,'#c8dfdb',1.2);path(c,[[14,-36],[16,-71],[26,-81],[40,-72],[34,-58],[27,-44]],ice,'#d3e4db',1.2);path(c,[[24,-81],[34,-89],[51,-78],[53,-70],[37,-67]],'#cbdcd4','#e9e6ce',1);
        for(const [x,s] of [[26,-1],[35,1]]){line(c,[[x,-82],[x+s*6,-100],[x+s*3,-113]],'#dce5d9',3);line(c,[[x+s*5,-98],[x+s*17,-103],[x+s*20,-114]],'#dce5d9',2);line(c,[[x+s*3,-107],[x-s*4,-116]],'#dce5d9',1.6);}
        path(c,[[28,-80],[18,-90],[19,-77]],'#b4d0d4','#e4e9d9',1);ellipse(c,43,-78,2,2,'#79aab9');for(let i=0;i<6;i++)ellipse(c,-18+i*7,-43+i%2*5,2,2,'#e6ecdc');path(c,[[-24,-42],[-38,-53],[-30,-37]],'#cbded5');
      }else if(body==='foxSpirit'){
        c.translate(0,beat*2-8);
        for(let i=0;i<5;i++){c.save();c.rotate((i-2)*.36);path(c,[[-6,-8],[-35,-18],[-50,-57],[-37,-75],[-33,-56],[-23,-30],[5,-18]],i%2?'#b5cdd0':'#87afbf','#e1e5d1',1);c.restore();}
        path(c,[[-10,0],[-15,-26],[-10,-51],[9,-55],[16,-29],[14,-4],[6,-13],[0,-1]],ice,'#d6e5dc',1.2);
        path(c,[[-15,-47],[-19,-83],[-4,-66],[2,-78],[10,-67],[26,-84],[20,-49],[3,-35]],'#d6e3d6','#e5e9d4',1.2);
        path(c,[[-14,-53],[-9,-59],[-3,-54],[-8,-50]],'#789fb3');path(c,[[9,-54],[15,-61],[19,-56],[13,-50]],'#789fb3');ellipse(c,3,-43,2,2,'#587784');path(c,[[3,-64],[0,-59],[3,-55],[6,-59]],'#92c5c4');
      }else if(body==='iceConstruct'){
        for(const side of [-1,1])for(let i=0;i<3;i++){const x=side*(26+i*6),yy=-82+i*23;path(c,[[side*18,yy],[x,yy-8],[side*(47+i*4),yy+6],[side*(43+i*4),yy+18],[x,yy+5]],ice,'#deebe0',1.2);path(c,[[side*(42+i*4),yy+13],[side*(61+i*4),yy+4],[side*(51+i*4),yy+27]],'#b2d4d8','#eff0da',1);}
        path(c,[[-22,-87],[-27,-42],[-18,-15],[0,-23],[18,-15],[28,-42],[22,-87],[0,-101]],ice,'#e6ead6',1.5);
        path(c,[[-19,-16],[-27,4],[-9,0],[0,-23],[9,0],[27,4],[18,-16]],'#92b9c8','#dbe6d8',1);
        path(c,[[0,-74],[-10,-56],[0,-38],[10,-56]],'#dff0df','#91c6d4',1.5);path(c,[[-14,-105],[-17,-86],[0,-77],[17,-86],[14,-105],[0,-117]],'#c4dedb','#eef0d9',1.3);
        line(c,[[-9,-94],[9,-94]],'#739ab3',3);path(c,[[-12,-105],[-19,-119],[-5,-112],[0,-133],[6,-112],[19,-119],[12,-105]],'#b8dbe0','#edf0da',1.2);
      }
      c.restore();
    }
    node(c,n,p){
      if(n.ready===false||typeof n.ready==='number'&&n.ready>0)return;
      const resource=n.resource||n.resourceField||(n.type==='herb'?'herbs':n.type==='crystal'?'stones':n.type);
      const herb=resource==='herbs',definition=window.Xian.CONTENT?.RESOURCES?.[resource];c.save();c.translate(n.x,n.y);shadow(c,0,0,10,4,.13);
      if(herb){line(c,[[0,0],[0,-16]],'#48764c',2);path(c,[[0,-4],[-12,-13],[-7,-14],[0,-9]],'#88b373');path(c,[[0,-7],[11,-17],[9,-8]],'#b1cc8c');
        for(let i=0;i<5;i++){const a=i*TAU/5;ellipse(c,Math.cos(a)*4,-20+Math.sin(a)*4,3.5,3.5,'#dbcda9');}ellipse(c,0,-20,2,2,'#efce76');
      }else if(resource==='spiritwood'){
        line(c,[[0,0],[0,-27]],'#576a45',5);line(c,[[0,-14],[-13,-25]],'#5c8153',3);line(c,[[0,-20],[14,-31]],'#5c8153',3);
        ellipse(c,-13,-27,9,5,'#8dbd83');ellipse(c,13,-33,9,5,'#b5d59a');ellipse(c,0,-33,9,7,'#91c293');
      }else if(resource==='iron'){
        path(c,[[-17,-3],[-14,-17],[-3,-26],[12,-19],[18,-3],[0,3]],'#7d8990','#b0beb8',1);path(c,[[-3,-26],[0,-2],[12,-19]],'#b9c4c2');line(c,[[-10,-9],[0,-15],[8,-10]],'#dbe6d7',2);
      }else if(resource==='ember'){
        path(c,[[-11,0],[-10,-15],[-3,-32],[8,-25],[14,-3]],'#c7754d','#f0b883');path(c,[[-3,-32],[1,-3],[8,-25]],'#efbd80');ellipse(c,0,-11,18,23,'rgba(232,141,70,.08)');
      }else if(resource==='frost'){
        path(c,[[-14,-2],[-11,-23],[0,-38],[9,-27],[15,0]],'#7daebb','#c3e8e3');path(c,[[0,-38],[0,0],[9,-27]],'#d0edf0');path(c,[[-13,-4],[-20,-14],[-19,0]],'#b9d8d9');
      }else if(resource==='core'||resource==='essence'){
        ellipse(c,0,0,14,5,'#79857d','#b4c3a1');const col=resource==='core'?'#c5b4eb':'#a4e7d3';const bob=Math.sin(this.t*2+n.x)*3;
        ellipse(c,0,-23+bob,10,11,col,'#e5eaca');for(let i=0;i<4;i++){const a=this.t+i*TAU/4;ellipse(c,Math.cos(a)*14,-23+bob+Math.sin(a)*6,1.7,1.7,'#f0e9c7');}
      }else if(resource==='relic'){
        path(c,[[-15,0],[-14,-47],[-5,-56],[14,-47],[16,0]],'#769387','#baceaf');line(c,[[-6,-39],[5,-39],[1,-30],[-6,-24],[5,-21]],'#e3d79e',2);
      }else{path(c,[[-8,0],[-11,-12],[-2,-30],[7,-23],[12,-4],[3,2]],'#80cfc0','#c7e9ce',1);path(c,[[-2,-30],[-1,-3],[7,-23]],'#bce6cd');path(c,[[-11,-12],[-16,-14],[-18,-2],[-8,0]],'#6aa99b');}
      if(Math.hypot(p.x-n.x,p.y-n.y)<145){const glow=.55+Math.sin(this.t*2+n.x)*.2;c.globalAlpha=glow;for(let i=0;i<3;i++){c.fillStyle=definition?.color||'#efddb0';c.fillRect(Math.sin(this.t+i*2+n.x)*15,-32-Math.cos(this.t+i)*8,2,2);}c.globalAlpha=1;}
      if(Math.hypot(p.x-n.x,p.y-n.y)<90)label(c,`[ E ] ${resource==='relic'?'调查':herb||resource==='spiritwood'?'采集':'采得'}${n.name||definition?.name||(herb?'灵草':'灵石')}`,0,-49,'#f6edc9',11);c.restore();
    }
    drop(c,d){
      c.save();c.translate(d.x,d.y);const yy=-8+Math.sin(this.t*4+d.x)*2;const col=window.Xian.CONTENT?.RESOURCES?.[d.type]?.color|| (d.type==='herb'||d.type==='herbs'?'#c8d797':d.type==='potion'||d.type==='potions'?'#d59686':d.type==='item'?'#c9b7ed':'#e4cf94');
      const g=c.createRadialGradient(0,yy,0,0,yy,18);g.addColorStop(0,'rgba(226,216,157,.35)');g.addColorStop(1,'rgba(226,216,157,0)');ellipse(c,0,yy,18,18,g);path(c,[[0,yy-6],[5,yy],[0,yy+6],[-5,yy]],col);c.restore();
    }
    projectile(c,o){
      c.save();c.translate(o.x,o.y);c.rotate(Math.atan2(o.vy||0,o.vx||1));const enemy=o.owner==='enemy'||o.owner!=='player'&&o.owner!==undefined;
      const color=o.color||ELEMENT_COLORS[o.element]||(enemy?'#deaf72':'#abeaca');c.shadowColor=color;c.shadowBlur=12;
      if(o.kind==='spectralBlade'){
        path(c,[[-18,-3],[18,0],[-18,3]],'#e6f2ca','#a6c7a7');line(c,[[-15,-7],[-15,7]],'#d8c389',2);line(c,[[-15,0],[-26,0]],'#e0d09c',3);
        line(c,[[-64,0],[-27,0]],color+'99',3);
      }else if(o.kind==='arrow'||o.weaponKind==='bow'){
        c.shadowBlur=5;line(c,[[-24,0],[13,0]],'#ead7a2',2);path(c,[[15,0],[7,-5],[9,0],[7,5]],'#f4eed3');
        path(c,[[-15,0],[-24,-5],[-23,0],[-24,5]],color);line(c,[[-56,0],[-27,0]],color+'66',1.5);
      }else if((o.kind==='orb'||o.weaponKind==='staff')&&o.element!=='fire'){
        const r=o.radius||8,g=c.createRadialGradient(0,0,0,0,0,r*2.5);g.addColorStop(0,color+'bb');g.addColorStop(1,color+'00');ellipse(c,0,0,r*2.5,r*2.5,g);
        path(c,[[12,0],[0,-8],[-9,0],[0,8]],'#d5f3d8');line(c,[[-38,-2],[-8,0]],color,3);line(c,[[-34,4],[-13,2]],color+'88',1);
      }else if(o.element==='fire'){ellipse(c,0,0,o.radius||9,(o.radius||9)*.8,color);path(c,[[-3,-6],[-24,-9],[-17,0],[-29,8],[-2,6]],color+'77');}
      else if(o.element==='ice'){path(c,[[-12,-5],[11,0],[-12,5],[-3,0]],color);line(c,[[-27,0],[-8,0]],'#b4e9f277',2);}
      else if(enemy){ellipse(c,0,0,o.radius||6,o.radius||6,color);line(c,[[-16,0],[-3,0]],color+'77',3);}
      else{path(c,[[-15,-3],[10,0],[-15,3],[-9,0]],color);line(c,[[-30,0],[-9,0]],color+'99',2);}
      c.restore();
    }
    effect(c,f){
      const alpha=Math.max(0,Math.min(1,(f.life||.1)/(f.maxLife||.5))),r=f.radius||f.r||50;
      c.save();c.translate(f.x,f.y);c.globalAlpha=alpha;
      if(f.type==='warning'){
        const lightning=f.element==='thunder'||f.behavior==='arc',color=f.color||(lightning?'#d4b3f3':'#f1996b');
        const projectileWarnings={ink:['墨刃扇射',3],poison:['毒针扇射',3],drain:['夺灵飞尘',1],prism:['八向光刃',8],song:['潮音环射',10],salamander:['双焰吐息',2],lantern:['六焰环射',6],fox:['双冰飞刃',2],sixarm:['六臂冰拳',6]};
        if(f.targetX!==undefined&&f.targetY!==undefined){
          const dx=f.targetX-f.x,dy=f.targetY-f.y,length=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);c.save();c.rotate(angle);
          path(c,[[0,-16],[Math.max(0,length-22),-16],[length,0],[Math.max(0,length-22),16],[0,16]],color+'23',color+'ad',1.5);
          c.setLineDash([8,10]);line(c,[[5,0],[length-16,0]],color,1.5);c.restore();
        }else if(projectileWarnings[f.behavior]){
          const [name,count]=projectileWarnings[f.behavior],source=this.currentState?.enemies?.find(e=>e.id===f.sourceId),radial=['prism','song','lantern','sixarm'].includes(f.behavior),aim=source?.facing||0;
          for(let i=0;i<count;i++){const a=radial?i*TAU/count+(source?.phase||0)*.2:aim+(i-(count-1)/2)*.22;c.save();c.rotate(a);line(c,[[28,0],[56,0],[49,-5]],color,1.5);line(c,[[56,0],[49,5]],color,1.5);c.restore();}
          label(c,name,0,-126,color,11);
        }else{
        ellipse(c,0,0,r,r,lightning?'rgba(153,101,211,.14)':'rgba(198,88,53,.15)',color,2);ellipse(c,0,0,r*(1-alpha*.7),r*(1-alpha*.7),null,color,1);
        for(let a=0;a<TAU;a+=TAU/8)line(c,[[Math.cos(a)*(r-5),Math.sin(a)*(r-5)],[Math.cos(a)*(r+5),Math.sin(a)*(r+5)]],color,2);
        if(lightning){path(c,[[5,-24],[-13,3],[1,3],[-6,23],[16,-6],[3,-6]],color);label(c,f.behavior==='arc'?`雷眼落雷 · ${f.life.toFixed(1)}秒`:'雷劫将至',0,-r-16,color,12);}
        else if(f.behavior)label(c,({swarm:'妖鼠扑咬',steal:'飞贼突进',guard:'双钳夹击',wave:'翻浪冲锋',brace:'蓄盾冲撞',dive:'云鹏落点',stag:'霜鹿冲锋',furnace:'炉心爆焰'})[f.behavior]||'攻击将至',0,-r-14,color,11);
        }
      }else if(f.type==='slash'){
        c.rotate(f.angle??f.facing??0);c.shadowColor='#c3f4de';c.shadowBlur=16;
        const sheen=c.createRadialGradient(0,-8,r*.55,0,-8,r);sheen.addColorStop(0,'#73cdaa00');sheen.addColorStop(.8,'#b3efda70');sheen.addColorStop(1,'#fffce5cc');
        c.beginPath();c.arc(0,-8,r*.92,-1.14,.82);c.arc(-12,-8,r*.72,.82,-1.14,true);c.closePath();c.fillStyle=sheen;c.fill();
        for(let j=0;j<3;j++){c.strokeStyle=j===0?'#fffce5':'#8bddc299';c.lineWidth=j===0?3.5*alpha:1.1;c.beginPath();c.arc(-j*4,-8,r*(.94-j*.07),-1.06+j*.07,.77);c.stroke();}
        c.shadowBlur=0;for(let i=0;i<8;i++){const a=-1.12+i*.24,rr=r*(.76+(1-alpha)*.26);line(c,[[Math.cos(a)*rr,Math.sin(a)*rr-8],[Math.cos(a)*(rr+9*(1-alpha)),Math.sin(a)*(rr+9*(1-alpha))-8]],'#f3f9d4',1.2);}
      }else if(f.type==='bowVolley'||f.type==='bowShot'){
        c.rotate(f.angle??this.currentPlayer.facing??0);const color=f.color||'#dce8b3';
        const count=f.type==='bowVolley'?2:0;c.shadowColor=color;c.shadowBlur=8;
        for(let i=-count;i<=count;i++){const a=i*.19,reach=f.type==='bowVolley'?84:54;line(c,[[Math.cos(a)*24,Math.sin(a)*24],[Math.cos(a)*reach,Math.sin(a)*reach]],color+'88',1.3);}
        c.beginPath();c.arc(27,0,12,-1.5,1.5);c.strokeStyle='#edf1ce';c.lineWidth=1.3;c.stroke();
      }else if(f.type==='orbCast'){
        c.rotate(f.angle??this.currentPlayer.facing??0);const color=f.color||'#abdcc0';
        c.shadowColor=color;c.shadowBlur=12;path(c,[[15,0],[32,-13],[52,0],[32,13]],null,color,2);line(c,[[25,-10],[25,10]],'#eff2cc',1);for(let i=0;i<5;i++){const a=i*TAU/5+(1-alpha)*2;path(c,[[32+Math.cos(a)*21,Math.sin(a)*21],[32+Math.cos(a+.15)*24,Math.sin(a+.15)*24]],null,'#e4f9dc',1);}
      }else if(f.type==='mindset'){
        const col=f.color||'#efe0ac',rr=18+(1-alpha)*22;c.shadowColor=col;c.shadowBlur=8;
        for(let i=0;i<5;i++){const a=i*TAU/5+(1-alpha)*.8;path(c,[[Math.cos(a)*rr,Math.sin(a)*rr-20],[Math.cos(a+.1)*(rr+8),Math.sin(a+.1)*(rr+8)-20]],null,col,2);}
        c.shadowBlur=0;label(c,f.text||'心法触发',0,-66-(1-alpha)*18,col,13);
      }else if(f.type==='damage'||f.type==='text'){
        label(c,String(f.text??f.amount??''),0,-30-(1-alpha)*30,f.color||'#ffe3b3',f.crit?19:14);
      }else if(f.type==='heal'){
        ellipse(c,0,-14,r*alpha,r*.6*alpha,null,f.color||'#cce8aa',2);for(let i=0;i<5;i++){c.fillStyle='#d6f2c5';c.fillRect(Math.sin(i*8)*r*.7,-15-(1-alpha)*45+i*4,2,7);}
      }else if(f.type==='flame'){
        const rr=r*(1.15-alpha*.45),g=c.createRadialGradient(0,0,rr*.4,0,0,rr);g.addColorStop(0,'#d6501700');g.addColorStop(.75,'#e9833533');g.addColorStop(1,'#e9833500');ellipse(c,0,-4,rr,rr*.72,g);
        for(let i=0;i<22;i++){const a=i*TAU/22,x=Math.cos(a)*rr,y=Math.sin(a)*rr*.72,h=(18+i%4*5)*alpha;c.save();c.translate(x,y);c.shadowColor='#e8984c';c.shadowBlur=8;const fire=c.createLinearGradient(0,-h,0,5);fire.addColorStop(0,'#bd451a00');fire.addColorStop(.4,'#e89545');fire.addColorStop(1,'#fff0b6');c.beginPath();c.moveTo(-6,2);c.quadraticCurveTo(-9,-h*.4,Math.sin(i+this.t*4)*5,-h);c.quadraticCurveTo(-1,-h*.35,6,1);c.closePath();c.fillStyle=fire;c.fill();c.restore();}
        for(let i=0;i<15;i++){const a=i*2.399,x=Math.cos(a)*rr*.8,y=Math.sin(a)*rr*.62-(1-alpha)*42;ellipse(c,x,y,1.2,2.2,'#ffd798');}
      }else if(f.type==='frost'){
        const rr=r*(1.2-alpha*.6),g=c.createRadialGradient(0,0,rr*.1,0,0,rr);g.addColorStop(0,'#b7eef322');g.addColorStop(.8,'#cef5fa33');g.addColorStop(1,'#cdf2f900');ellipse(c,0,0,rr,rr*.76,g);
        for(let i=0;i<14;i++){const a=i*TAU/14;c.save();c.translate(Math.cos(a)*rr,Math.sin(a)*rr*.76);c.rotate(a);path(c,[[-5,0],[5,-7],[23,0],[5,7]],'#b4e2f0bb','#eafaed',.8);path(c,[[5,-7],[23,0],[5,1]],'#f1fff2');c.restore();line(c,[[0,0],[Math.cos(a)*rr*.75,Math.sin(a)*rr*.57]],'#e4f6f355',.7);}
        for(let i=0;i<16;i++){const a=i*2.399,x=Math.cos(a)*rr*.9,y=Math.sin(a)*rr*.68;line(c,[[x-3,y],[x+3,y]],'#f0fcf7',.8);line(c,[[x,y-3],[x,y+3]],'#f0fcf7',.8);}
      }else if(f.type==='root'){
        for(let i=0;i<10;i++){const a=i*TAU/10,x=Math.cos(a)*r*.8,y=Math.sin(a)*r*.65;c.beginPath();c.moveTo(0,0);c.bezierCurveTo(x*.2,y*.4-22,x*.7+9,y*.7+17,x,y);c.strokeStyle='#507b4e';c.lineWidth=3;c.stroke();c.strokeStyle=f.color||'#a5d398';c.lineWidth=1.2;c.stroke();for(let j=1;j<4;j++){const xx=x*j/4,yy=y*j/4;path(c,[[xx,yy],[xx+11,yy-14],[xx+15,yy-9],[xx+7,yy-2]],'#a7d998aa','#dae8ae88',.7);}}
      }else if(f.type==='thunder'||f.type==='lightning'){
        const x=(f.fromX??f.x)-f.x,y=(f.fromY??f.y-(f.type==='lightning'?250:75))-f.y,color=f.color||'#d9c5fb';
        const bolt=[[x,y],[x*.75+12,y*.75],[x*.5-10,y*.5],[x*.25+8,y*.25],[0,-4]];c.shadowColor=color;c.shadowBlur=20;line(c,bolt,color+'55',8);line(c,bolt,color,3);line(c,bolt,'#fff9ec',1);line(c,[[x*.5-10,y*.5],[x*.5+24,y*.5+15],[x*.5+31,y*.5+38]],color+'99',1.2);c.shadowBlur=0;ellipse(c,0,-4,22*(1-alpha)+7,12*(1-alpha)+5,null,color,2);
      }else if(f.type==='shield'){
        const rr=Math.min(r,54),g=c.createRadialGradient(0,-23,rr*.3,0,-23,rr);g.addColorStop(0,'#c29c5900');g.addColorStop(1,'#ecd29f44');ellipse(c,0,-23,rr,rr*1.1,g,f.color||'#dbc48e',1.3);ellipse(c,0,1,rr+7,rr*.38,null,'#e0cea288',1);
        for(let yy=-49;yy<16;yy+=14)for(let xx=-25;xx<26;xx+=16){if(xx*xx+(yy+23)**2>rr*rr*.8)continue;const hex=[];for(let j=0;j<6;j++){const a=j*TAU/6;hex.push([xx+Math.cos(a)*8,yy+Math.sin(a)*8]);}path(c,hex,null,'#e3cca34d',.6);}
        for(let i=0;i<6;i++){const a=i*TAU/6+this.t*.3;path(c,[[Math.cos(a)*rr-4,Math.sin(a)*rr*.7-18],[Math.cos(a)*rr,Math.sin(a)*rr*.7-26],[Math.cos(a)*rr+4,Math.sin(a)*rr*.7-18]],'#e4cf9c');}
      }else if(f.type==='burst'||f.type==='ring'||f.type==='impact'){
        const rr=r*(1.2-alpha*.55);const color=f.color||(f.type==='impact'?'#e4b277':'#b9efd0');ellipse(c,0,-3,rr,rr*.78,null,color,3*alpha);
        ellipse(c,0,-3,rr*.6,rr*.47,null,color,1);for(let i=0;i<12;i++){const a=i*TAU/12+this.t*.2;line(c,[[Math.cos(a)*rr*.7,Math.sin(a)*rr*.56],[Math.cos(a)*rr,Math.sin(a)*rr*.78]],color,2);}
        if(f.element==='earth')for(let i=0;i<13;i++){const a=i*2.399,x=Math.cos(a)*rr*.7,y=Math.sin(a)*rr*.54,h=10+Math.sin(alpha*Math.PI)*24;path(c,[[x-7,y],[x-5,y-h],[x+2,y-h-4],[x+9,y-h*.6],[x+7,y+2]],'#9b8765','#e5c98f',.7);path(c,[[x+2,y-h-4],[x+9,y-h*.6],[x+7,y+2],[x+1,y]],'#c2ab80');}
      }else{
        const color=f.color||'#daeec5';for(let i=0;i<5;i++){const a=i*2.6;ellipse(c,Math.cos(a)*(1-alpha)*20,Math.sin(a)*(1-alpha)*20-15,2*alpha,2*alpha,color);}
      }
      c.restore();
    }
  }
  window.XianRenderer = Renderer;
})();
