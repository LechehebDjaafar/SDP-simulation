(function(){
  var S={h:6,m:42,soc:62,sec:[],sav:0,cost:0,pumpH:0,kwh:{s:0,b:0,g:0},alerts:0,pump:false,src:'solar',hist:{m:[],tr:[],sol:[],ld:[],soc:[],et:[],tp:[]}};
  for(var i=0;i<8;i++)S.sec.push(30+Math.random()*30);
  var N=60,KP=[['ماء مُوفَّر (م³)','sav',0],['قيمة التوفير (دج)','cost',0],['ساعات تشغيل المضخة','pumpH',1],['حصة الشمس %','sh',0],['البطارية %','soc',0],['ساعة المحاكاة','clk',-1],['مصدر الطاقة الحالي','srcn',-2],['تحويلات ATS','alerts',0]];
  var kp=document.getElementById('kp'),el={},cur={};
  KP.forEach(function(k){var d=document.createElement('div');d.className='kpi';d.innerHTML='<span>'+k[0]+'</span><b>0</b>';kp.appendChild(d);el[k[1]]=d.lastChild;cur[k[1]]=0});
  var SN={solar:'☀ الشمس',battery:'🔋 البطارية',grid:'⚡ الشبكة'};
  function tick(){
    var dt=1,hr=.15*dt;S.h=(S.h+hr)%24;
    var dl=Math.max(0,Math.sin((S.h-6)/12*Math.PI)),T=30+12*Math.sin((S.h-9)/24*6.2832),wind=4.5+2*Math.sin(S.h*.7);
    var et0=.0375*(T+17.8)*3.74*(1+.02*(wind-3))*(.4+.6*dl),etc=et0*1.15,avg=S.sec.reduce(function(a,b){return a+b},0)/8,tr=Math.min(55,32+2.5*etc);
    if(!S.pump&&avg<tr&&wind<8.5&&!(S.h>=12&&S.h<16))S.pump=true;if(S.pump&&(avg>=72||wind>8.5))S.pump=false;
    S.sec=S.sec.map(function(v,i){var up=S.pump&&Math.abs(((S.h*8)%8)-i)<1.2?6:0;return Math.max(5,Math.min(95,v+up*dt-.04*etc*dt*(1+Math.random()*.4)))});
    var sol=14*dl,ld=.5+(S.pump?11:0)+(S.pump?1.2:0),prev=S.src;
    if(sol>=ld&&sol>.8)S.src='solar';else if(S.soc>20&&!(prev==='grid'&&S.soc<40))S.src='battery';else S.src='grid';
    var k=.13;if(S.src==='solar')S.soc=Math.min(100,S.soc+(sol-ld)*k);else if(S.src==='battery')S.soc=Math.max(0,S.soc-(ld-sol)*k);else S.soc=Math.min(100,S.soc+sol*k);
    if(S.src!==prev)S.alerts++;
    S.kwh[S.src==='solar'?'s':S.src==='battery'?'b':'g']+=ld*hr;
    if(S.pump){S.pumpH+=hr;var q=150*hr*.35/.65;S.sav+=q;S.cost+=q*4}
    var H=S.hist;[['m',avg],['tr',tr],['sol',sol],['ld',ld],['soc',S.soc],['et',et0],['tp',T]].forEach(function(p){H[p[0]].push(p[1]);if(H[p[0]].length>N)H[p[0]].shift()});
    var tot=S.kwh.s+S.kwh.b+S.kwh.g||1;S.sh=S.kwh.s/tot*100;
    S.clk=('0'+Math.floor(S.h)).slice(-2)+':'+('0'+Math.floor(S.h%1*60)).slice(-2);
    draw();
  }
  function cv(id){var c=document.getElementById(id),r=window.devicePixelRatio||1,w=c.clientWidth,h=c.clientHeight;if(c.width!==w*r){c.width=w*r;c.height=h*r}var g=c.getContext('2d');g.setTransform(r,0,0,r,0,0);g.clearRect(0,0,w,h);return{g:g,w:w,h:h}}
  function grid(o,mn,mx){var g=o.g;g.strokeStyle='rgba(238,242,232,.1)';g.fillStyle='#a9bbb0';g.font='11px Tajawal,sans-serif';g.textAlign='right';for(var i=0;i<=4;i++){var y=8+(o.h-24)*i/4;g.beginPath();g.moveTo(34,y);g.lineTo(o.w-4,y);g.stroke();g.fillText((mx-(mx-mn)*i/4).toFixed(mx>20?0:1),30,y+4)}}
  function line(id,ser,mn,mx){var o=cv(id),g=o.g;grid(o,mn,mx);ser.forEach(function(s){g.strokeStyle=s[1];g.lineWidth=2;g.beginPath();s[0].forEach(function(v,i){var x=34+(o.w-38)*i/(N-1),y=8+(o.h-24)*(1-(v-mn)/(mx-mn));i?g.lineTo(x,y):g.moveTo(x,y)});g.stroke()})}
  function bars(id,arr){var o=cv(id),g=o.g;grid(o,0,100);var bw=(o.w-44)/arr.length;arr.forEach(function(v,i){var h=(o.h-24)*v/100,x=38+i*bw+4;g.fillStyle=v<30?'#e74c3c':v<45?'#f1c40f':v<=80?'#2ecc71':'#3498db';g.fillRect(x,o.h-16-h,bw-8,h);g.fillStyle='#a9bbb0';g.textAlign='center';g.fillText('ق'+(i+1),x+bw/2-4,o.h-3)})}
  function donut(id,v){var o=cv(id),g=o.g,t=v.reduce(function(a,b){return a+b[0]},0)||1,a0=-Math.PI/2,cx=o.w/2,cy=o.h/2,R=Math.min(o.w,o.h)/2-10;v.forEach(function(p){var a=p[0]/t*6.2832;g.fillStyle=p[1];g.beginPath();g.moveTo(cx,cy);g.arc(cx,cy,R,a0,a0+a);g.fill();a0+=a});g.fillStyle='#15271e';g.beginPath();g.arc(cx,cy,R*.58,0,6.2832);g.fill();g.fillStyle='#eef2e8';g.font='700 18px Tajawal,sans-serif';g.textAlign='center';g.fillText(Math.round(S.kwh.s/t*100)+'% شمس',cx,cy+6)}
  function draw(){var H=S.hist;line('c1',[[H.m,'#58c28f'],[H.tr,'#e0a65a']],0,100);line('c2',[[H.sol,'#ffd23f'],[H.ld,'#ff9f43']],0,16);line('c3',[[H.soc,'#4cd964']],0,100);
    line('c4',[[H.et,'#4aa3ff'],[H.tp,'#ff6b6b']],0,45);bars('c5',S.sec);donut('c6',[[S.kwh.s,'#ffd23f'],[S.kwh.b,'#4cd964'],[S.kwh.g,'#4aa3ff']])}
  function ui(){KP.forEach(function(k){var n=k[1],v=S[n];if(k[2]===-1){el[n].textContent=S.clk;return}if(k[2]===-2){el[n].textContent=SN[S.src];return}
    v=v||0;cur[n]+=(v-cur[n])*.12;el[n].textContent=Number(cur[n]).toLocaleString('en-US',{minimumFractionDigits:k[2],maximumFractionDigits:k[2]})});requestAnimationFrame(ui)}
  for(var i=0;i<N;i++)tick();setInterval(tick,1000);ui();addEventListener('resize',draw);
})();
