/* ============================================================
   NAGI AI SOLUTIONS — SCRIPT
   ============================================================ */
(function(){
"use strict";

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.getElementById('year').textContent = new Date().getFullYear();

/* ---------------- NAV ---------------- */
const nav = document.getElementById('nav');
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive:true });

menuToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('mobile-open');
  menuToggle.classList.toggle('open', open);
  menuToggle.setAttribute('aria-expanded', open);
});
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('mobile-open');
  menuToggle.classList.remove('open');
}));

/* active link highlight */
const sections = [...document.querySelectorAll('main section[id]')];
const navA = [...navLinks.querySelectorAll('a')];
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if(en.isIntersecting){
      navA.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#'+en.target.id));
    }
  });
}, { rootMargin:'-45% 0px -50% 0px' });
sections.forEach(s => navObserver.observe(s));

/* ---------------- SCROLL REVEAL ---------------- */
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if(en.isIntersecting){
      en.target.classList.add('in');
      revealObserver.unobserve(en.target);
    }
  });
}, { threshold:0.12 });
revealEls.forEach(el => revealObserver.observe(el));

/* ---------------- TILT EFFECT ---------------- */
if(!reduceMotion){
  document.addEventListener('mousemove', (e) => {
    const tilts = document.querySelectorAll('.tilt');
    tilts.forEach(card => {
      const r = card.getBoundingClientRect();
      if(e.clientX < r.left-40 || e.clientX > r.right+40 || e.clientY < r.top-40 || e.clientY > r.bottom+40) return;
      const px = (e.clientX - r.left)/r.width - 0.5;
      const py = (e.clientY - r.top)/r.height - 0.5;
      const inside = e.clientX>=r.left && e.clientX<=r.right && e.clientY>=r.top && e.clientY<=r.bottom;
      if(inside){
        card.style.transform = `perspective(700px) rotateX(${(-py*7).toFixed(2)}deg) rotateY(${(px*7).toFixed(2)}deg) translateY(-4px)`;
      } else {
        card.style.transform = '';
      }
    });
  }, { passive:true });
  document.addEventListener('mouseleave', () => {
    document.querySelectorAll('.tilt').forEach(c => c.style.transform = '');
  });
}

/* ---------------- 3D NODE-NETWORK BACKGROUND ---------------- */
(function(){
  const canvas = document.getElementById('particle-canvas');
  if(!window.THREE || !canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 13);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const group = new THREE.Group();
  scene.add(group);

  const NODE_COUNT = window.innerWidth < 700 ? 46 : 90;
  const positions = new Float32Array(NODE_COUNT * 3);
  const nodeData = [];
  for(let i=0;i<NODE_COUNT;i++){
    const r = 6 + Math.random()*3;
    const theta = Math.random()*Math.PI*2;
    const phi = Math.acos((Math.random()*2)-1);
    const x = r*Math.sin(phi)*Math.cos(theta);
    const y = r*Math.sin(phi)*Math.sin(theta)*0.55;
    const z = r*Math.cos(phi);
    positions[i*3]=x; positions[i*3+1]=y; positions[i*3+2]=z;
    nodeData.push({x,y,z});
  }
  const pointsGeo = new THREE.BufferGeometry();
  pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions,3));
  const pointsMat = new THREE.PointsMaterial({
    color: 0x6FE3FF, size: 0.09, transparent:true, opacity:0.85, sizeAttenuation:true
  });
  const points = new THREE.Points(pointsGeo, pointsMat);
  group.add(points);

  const lineVerts = [];
  const MAX_DIST = 3.1;
  for(let i=0;i<NODE_COUNT;i++){
    for(let j=i+1;j<NODE_COUNT;j++){
      const a = nodeData[i], b = nodeData[j];
      const d = Math.hypot(a.x-b.x, a.y-b.y, a.z-b.z);
      if(d < MAX_DIST) lineVerts.push(a.x,a.y,a.z, b.x,b.y,b.z);
    }
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lineVerts),3));
  const lineMat = new THREE.LineBasicMaterial({ color:0x3E7BFA, transparent:true, opacity:0.2 });
  group.add(new THREE.LineSegments(lineGeo, lineMat));

  const wireGeo = new THREE.IcosahedronGeometry(9, 1);
  const wireMat = new THREE.MeshBasicMaterial({ color:0x14203F, wireframe:true, transparent:true, opacity:0.25 });
  const wireSphere = new THREE.Mesh(wireGeo, wireMat);
  group.add(wireSphere);

  group.rotation.x = 0.15;

  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', (e)=>{
    mouseX = (e.clientX / window.innerWidth - 0.5);
    mouseY = (e.clientY / window.innerHeight - 0.5);
  }, { passive:true });

  function resize(){
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w/h;
    camera.updateProjectionMatrix();
    renderer.setSize(w,h);
  }
  window.addEventListener('resize', resize);

  let t = 0;
  function animate(){
    requestAnimationFrame(animate);
    if(!reduceMotion){
      t += 0.0018;
      group.rotation.y = t + mouseX*0.4;
      group.rotation.x = 0.15 + mouseY*0.2;
      wireSphere.rotation.y -= 0.0007;
      const pulse = Math.sin(t*22);
      pointsMat.size = 0.09 + pulse*0.012;
      const breathe = 1 + Math.sin(t*9)*0.02;
      wireSphere.scale.setScalar(breathe);
      wireMat.opacity = 0.2 + Math.sin(t*9)*0.06;
    }
    renderer.render(scene, camera);
  }
  animate();
})();

/* ============================================================
   HERO FLOW DIAGRAM
   ============================================================ */
function buildHero(){
  const wrap = document.getElementById('heroVisual');

  const leftNodes = [
    {label:'Websites', icon:'globe'},
    {label:'Databases', icon:'db'},
    {label:'Excel Files', icon:'sheet'},
    {label:'PDFs / Docs', icon:'doc'},
    {label:'APIs / Cloud', icon:'cloud'},
  ];
  const rightNodes = [
    {label:'Dashboards', icon:'dash'},
    {label:'Reports', icon:'doc'},
    {label:'Alerts', icon:'bell'},
    {label:'Integrations', icon:'link'},
    {label:'Forecasts', icon:'trend'},
  ];

  const W = 640, H = 520;
  const leftX = 55, rightX = W-55, cx = W/2, cy = H/2;
  const topPad = 60, gap = (H - topPad*2) / (leftNodes.length-1);

  function nodeIcon(type){
    const colors = {
      globe:'#6FE3FF', db:'#FFB020', sheet:'#34D399', doc:'#FF6B6B', cloud:'#3E7BFA',
      dash:'#7C6CFF', bell:'#FFB020', link:'#F472B6', trend:'#34D399'
    };
    const c = colors[type] || '#6FE3FF';
    const badge = `<circle cx="0" cy="0" r="15" fill="${c}" opacity="0.16"/><circle cx="0" cy="0" r="15" fill="none" stroke="${c}" stroke-width="1.1" opacity="0.55"/>`;
    let icon = '';
    switch(type){
      case 'globe': icon = `<circle cx="0" cy="0" r="8" fill="none" stroke="${c}" stroke-width="1.4"/><ellipse cx="0" cy="0" rx="3.6" ry="8" fill="none" stroke="${c}" stroke-width="1.1"/><line x1="-8" y1="0" x2="8" y2="0" stroke="${c}" stroke-width="1.1"/><line x1="-6" y1="-4.5" x2="6" y2="-4.5" stroke="${c}" stroke-width=".9" opacity=".7"/><line x1="-6" y1="4.5" x2="6" y2="4.5" stroke="${c}" stroke-width=".9" opacity=".7"/>`; break;
      case 'db': icon = `<ellipse cx="0" cy="-5.5" rx="8" ry="2.8" fill="${c}" opacity=".9"/><path d="M-8,-5.5 V5.5 C-8,7 -4.5,8.2 0,8.2 C4.5,8.2 8,7 8,5.5 V-5.5" fill="none" stroke="${c}" stroke-width="1.3"/><path d="M-8,0 C-8,1.5 -4.5,2.8 0,2.8 C4.5,2.8 8,1.5 8,0" fill="none" stroke="${c}" stroke-width="1"/>`; break;
      case 'sheet': icon = `<rect x="-8" y="-8" width="16" height="16" rx="2" fill="${c}" opacity=".14" stroke="${c}" stroke-width="1.3"/><line x1="-8" y1="-2.5" x2="8" y2="-2.5" stroke="${c}" stroke-width="1"/><line x1="-8" y1="2.5" x2="8" y2="2.5" stroke="${c}" stroke-width="1"/><line x1="-2.5" y1="-8" x2="-2.5" y2="8" stroke="${c}" stroke-width="1"/><line x1="2.5" y1="-8" x2="2.5" y2="8" stroke="${c}" stroke-width="1"/>`; break;
      case 'doc': icon = `<path d="M-5.5,-8 H3 L5.5,-5.5 V8 H-5.5 Z" fill="${c}" opacity=".16" stroke="${c}" stroke-width="1.3" stroke-linejoin="round"/><path d="M3,-8 V-5.5 H5.5" fill="none" stroke="${c}" stroke-width="1.1"/><line x1="-2.8" y1="-1" x2="2.8" y2="-1" stroke="${c}" stroke-width="1"/><line x1="-2.8" y1="2.6" x2="2.8" y2="2.6" stroke="${c}" stroke-width="1"/>`; break;
      case 'cloud': icon = `<path d="M-7,3 a3.6,3.6 0 0 1 0,-7.2 a4.4,4.4 0 0 1 8.4,-1.3 a4,4 0 0 1 1.3,8.5 Z" fill="${c}" opacity=".85" stroke="${c}" stroke-width="1.1"/>`; break;
      case 'dash': icon = `<rect x="-8" y="-7" width="16" height="14" rx="2" fill="${c}" opacity=".1" stroke="${c}" stroke-width="1.3"/><rect x="-5.4" y="0" width="2.6" height="4.4" fill="${c}"/><rect x="-1.3" y="-2.6" width="2.6" height="7" fill="${c}"/><rect x="2.7" y="-4.4" width="2.6" height="8.8" fill="${c}"/>`; break;
      case 'bell': icon = `<path d="M0,-7 C3.5,-7 5.3,-4.5 5.3,-1 V2.6 L7,5.3 H-7 L-5.3,2.6 V-1 C-5.3,-4.5 -3.5,-7 0,-7 Z" fill="${c}" opacity=".18" stroke="${c}" stroke-width="1.3"/><path d="M-2.2,6.6 a2.2,2.2 0 0 0 4.4,0" fill="none" stroke="${c}" stroke-width="1.2"/>`; break;
      case 'link': icon = `<rect x="-7" y="-3" width="8" height="6" rx="3" fill="none" stroke="${c}" stroke-width="1.3" transform="rotate(-40)"/><rect x="-1" y="-3" width="8" height="6" rx="3" fill="none" stroke="${c}" stroke-width="1.3" transform="rotate(-40)"/>`; break;
      case 'trend': icon = `<polyline points="-8,5.3 -2.6,-1 1,2.6 8,-7" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><polyline points="3.6,-7 8,-7 8,-2.6" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`; break;
      default: icon = '';
    }
    return badge + icon;
  }

  function sideNodes(list, x, dir){
    return list.map((n,i) => {
      const y = topPad + gap*i;
      return {x, y, ...n};
    });
  }
  const L = sideNodes(leftNodes, leftX);
  const R = sideNodes(rightNodes, rightX);

  let paths = '', nodesSvg = '', particlesSvg = '';
  L.forEach((n,i) => {
    const midX = cx - 130;
    const d = `M${n.x+22},${n.y} C${midX},${n.y} ${midX},${cy} ${cx-30},${cy}`;
    paths += `<path d="${d}" fill="none" stroke="url(#flowGradL)" stroke-width="1.2" opacity="0.55"/>`;
    paths += `<path class="flow-dash" d="${d}" fill="none" stroke="#6FE3FF" stroke-width="1.6" opacity="0.9" style="animation-delay:${(i*0.3).toFixed(2)}s"/>`;
    nodesSvg += `<g class="flow-node" transform="translate(${n.x},${n.y})">
      <rect class="flow-node-bg" x="-46" y="-16" width="92" height="32" rx="9"/>
      <g transform="translate(-30,0)" class="flow-node-icon">${nodeIcon(n.icon)}</g>
      <text class="flow-node-label" x="-14" y="4">${n.label}</text>
    </g>`;
  });
  R.forEach((n,i) => {
    const midX = cx + 130;
    const d = `M${cx+30},${cy} C${midX},${cy} ${midX},${n.y} ${n.x-22},${n.y}`;
    paths += `<path d="${d}" fill="none" stroke="url(#flowGradR)" stroke-width="1.2" opacity="0.55"/>`;
    paths += `<path class="flow-dash" d="${d}" fill="none" stroke="#7C6CFF" stroke-width="1.6" opacity="0.9" style="animation-delay:${(i*0.3+0.9).toFixed(2)}s"/>`;
    nodesSvg += `<g class="flow-node" transform="translate(${n.x},${n.y})">
      <rect class="flow-node-bg" x="-46" y="-16" width="92" height="32" rx="9"/>
      <g transform="translate(-30,0)" class="flow-node-icon">${nodeIcon(n.icon)}</g>
      <text class="flow-node-label" x="-14" y="4">${n.label}</text>
    </g>`;
  });

  const svg = `
  <svg class="flow-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="flowGradL" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#6FE3FF" stop-opacity="0"/>
        <stop offset="100%" stop-color="#6FE3FF" stop-opacity="0.7"/>
      </linearGradient>
      <linearGradient id="flowGradR" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#7C6CFF" stop-opacity="0.7"/>
        <stop offset="100%" stop-color="#7C6CFF" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="engineGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#6FE3FF" stop-opacity="0.9"/>
        <stop offset="60%" stop-color="#3E7BFA" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#3E7BFA" stop-opacity="0"/>
      </radialGradient>
    </defs>

    ${paths}

    <g class="engine-core" transform="translate(${cx},${cy})">
      <circle r="62" fill="url(#engineGlow)"/>
      <circle class="engine-ring" r="46" stroke="#6FE3FF">
        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="14s" repeatCount="indefinite"/>
      </circle>
      <circle class="engine-ring" r="36" stroke="#7C6CFF" stroke-dasharray="4 6">
        <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="10s" repeatCount="indefinite"/>
      </circle>
      <circle r="24" fill="#0E1735" stroke="#6FE3FF" stroke-width="1.4"/>
      <circle r="24" fill="none" stroke="#6FE3FF" stroke-width="1.4">
        <animate attributeName="r" values="20;26;20" dur="2.4s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.7;0.1;0.7" dur="2.4s" repeatCount="indefinite"/>
      </circle>
      <g transform="translate(0,-4)" opacity="0.95">
        <rect x="-8" y="-8" width="16" height="16" rx="3" fill="none" stroke="#6FE3FF" stroke-width="1.2"/>
        <rect x="-4" y="-4" width="8" height="8" rx="1.4" fill="#6FE3FF" opacity="0.5"/>
        <line x1="0" y1="-11" x2="0" y2="-8" stroke="#6FE3FF" stroke-width="1.1"/>
        <line x1="0" y1="8" x2="0" y2="11" stroke="#6FE3FF" stroke-width="1.1"/>
        <line x1="-11" y1="0" x2="-8" y2="0" stroke="#6FE3FF" stroke-width="1.1"/>
        <line x1="8" y1="0" x2="11" y2="0" stroke="#6FE3FF" stroke-width="1.1"/>
        <line x1="-8" y1="-8" x2="-6" y2="-6" stroke="#7C6CFF" stroke-width="1"/>
        <line x1="8" y1="-8" x2="6" y2="-6" stroke="#7C6CFF" stroke-width="1"/>
        <line x1="-8" y1="8" x2="-6" y2="6" stroke="#7C6CFF" stroke-width="1"/>
        <line x1="8" y1="8" x2="6" y2="6" stroke="#7C6CFF" stroke-width="1"/>
      </g>
      <text x="0" y="19" text-anchor="middle" font-family="Sora, sans-serif" font-size="8" font-weight="700" fill="#F6F8FC" letter-spacing="0.5">AI ENGINE</text>
    </g>

    ${nodesSvg}
  </svg>`;

  const dashMock = `
  <div class="dash-mock" aria-hidden="true">
    <div class="dm-head"><span class="dm-title">LIVE PIPELINE</span><span class="dm-dot"></span></div>
    <div class="dm-kpis">
      <div class="dm-kpi"><b>98%</b><span>UPTIME</span></div>
      <div class="dm-kpi"><b>1.2K</b><span>RECORDS/HR</span></div>
    </div>
    <svg viewBox="0 0 220 60" width="100%" height="46">
      <polyline points="0,45 25,30 50,38 75,15 100,24 125,8 150,20 175,6 200,16 220,4" fill="none" stroke="#6FE3FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="0,45 25,30 50,38 75,15 100,24 125,8 150,20 175,6 200,16 220,4" fill="none" stroke="#6FE3FF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.12"/>
    </svg>
  </div>`;

  wrap.innerHTML = svg + dashMock;
}
if(!document.getElementById('heroVisual')?.classList.contains('hero-video-mode')){
  buildHero();
}

/* ============================================================
   SERVICE GRAPHICS — 11 unique animated mini graphics
   ============================================================ */
const svgOpen = (vb='0 0 300 150') => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">`;

const serviceGraphics = [
  // 1. AI Workflow Automation — nodes connected by animated lines
  () => `${svgOpen()}
    <g stroke="#6FE3FF" stroke-width="1.2" fill="none" opacity="0.5">
      <path d="M40,110 C70,60 100,120 140,75"/><path d="M140,75 C170,40 200,100 260,50"/><path d="M140,75 C160,110 210,120 250,110"/>
    </g>
    <path class="flow-dash" d="M40,110 C70,60 100,120 140,75" stroke="#6FE3FF" stroke-width="2" fill="none"/>
    <path class="flow-dash" d="M140,75 C170,40 200,100 260,50" stroke="#3E7BFA" stroke-width="2" fill="none" style="animation-delay:.4s"/>
    <path class="flow-dash" d="M140,75 C160,110 210,120 250,110" stroke="#7C6CFF" stroke-width="2" fill="none" style="animation-delay:.8s"/>
    <circle cx="40" cy="110" r="7" fill="#0E1735" stroke="#6FE3FF" stroke-width="1.5"/>
    <circle cx="140" cy="75" r="10" fill="#0E1735" stroke="#6FE3FF" stroke-width="1.6" class="pulse-dot"/>
    <circle cx="260" cy="50" r="6" fill="#0E1735" stroke="#3E7BFA" stroke-width="1.4"/>
    <circle cx="250" cy="110" r="6" fill="#0E1735" stroke="#7C6CFF" stroke-width="1.4"/>
  </svg>`,

  // 2. Excel & Report Automation — spreadsheet -> report/chart
  () => `${svgOpen()}
    <g transform="translate(40,35)">
      <rect width="70" height="70" rx="4" fill="none" stroke="#6FE3FF" stroke-width="1.3"/>
      <line x1="0" y1="23" x2="70" y2="23" stroke="#6FE3FF" stroke-width="1" opacity=".5"/>
      <line x1="0" y1="46" x2="70" y2="46" stroke="#6FE3FF" stroke-width="1" opacity=".5"/>
      <line x1="23" y1="0" x2="23" y2="70" stroke="#6FE3FF" stroke-width="1" opacity=".5"/>
      <line x1="46" y1="0" x2="46" y2="70" stroke="#6FE3FF" stroke-width="1" opacity=".5"/>
    </g>
    <path class="flow-dash" d="M118,70 H185" stroke="#3E7BFA" stroke-width="2" fill="none"/>
    <g transform="translate(195,32)">
      <rect width="66" height="76" rx="5" fill="#0E1735" stroke="#7C6CFF" stroke-width="1.3"/>
      <rect x="10" y="46" width="8" height="18" fill="#6FE3FF" class="v-bar"/>
      <rect x="24" y="34" width="8" height="30" fill="#3E7BFA" class="v-bar" style="animation-delay:.3s"/>
      <rect x="38" y="24" width="8" height="40" fill="#7C6CFF" class="v-bar" style="animation-delay:.6s"/>
      <line x1="10" y1="14" x2="48" y2="14" stroke="#F6F8FC" stroke-width="2" opacity=".4"/>
    </g>
  </svg>`,

  // 3. AI Consulting & Solution Design — roadmap w/ decision nodes
  () => `${svgOpen()}
    <path d="M25,110 Q90,30 150,80 T275,45" fill="none" stroke="#6FE3FF" stroke-width="1.4" opacity=".55" stroke-dasharray="3 5"/>
    ${[[25,110],[90,55],[150,80],[210,55],[275,45]].map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="#0E1735" stroke="#6FE3FF" stroke-width="1.5" class="fade-cycle" style="animation-delay:${i*0.3}s"/>`).join('')}
    <circle cx="150" cy="80" r="10" fill="none" stroke="#7C6CFF" stroke-width="1.5" class="pulse-dot"/>
  </svg>`,

  // 4. AI-Powered Dashboards — dashboard w/ bars + line + kpi counter
  () => `${svgOpen()}
    <rect x="30" y="25" width="240" height="100" rx="8" fill="#0E1735" stroke="#6FE3FF" stroke-width="1.2" opacity=".8"/>
    <g transform="translate(48,55)">
      <rect x="0" y="30" width="14" height="20" fill="#6FE3FF" class="v-bar"/>
      <rect x="20" y="15" width="14" height="35" fill="#3E7BFA" class="v-bar" style="animation-delay:.2s"/>
      <rect x="40" y="25" width="14" height="25" fill="#7C6CFF" class="v-bar" style="animation-delay:.4s"/>
    </g>
    <polyline points="115,90 140,65 165,80 190,45 215,60 240,35" fill="none" stroke="#6FE3FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="240" cy="35" r="3.5" fill="#6FE3FF" class="pulse-dot"/>
  </svg>`,

  // 5. AI Document Intelligence — PDF scanning w/ extracted fields
  () => `${svgOpen()}
    <g transform="translate(110,20)">
      <rect width="80" height="104" rx="4" fill="#0E1735" stroke="#6FE3FF" stroke-width="1.3"/>
      <line x1="12" y1="20" x2="68" y2="20" stroke="#6FE3FF" stroke-width="1.4" opacity=".5"/>
      <line x1="12" y1="34" x2="68" y2="34" stroke="#6FE3FF" stroke-width="1.4" opacity=".5"/>
      <line x1="12" y1="48" x2="50" y2="48" stroke="#6FE3FF" stroke-width="1.4" opacity=".5"/>
      <rect x="0" y="4" width="80" height="3" fill="#3E7BFA" opacity=".8">
        <animate attributeName="y" values="4;96;4" dur="3s" repeatCount="indefinite"/>
      </rect>
    </g>
    <rect x="215" y="35" width="55" height="14" rx="3" fill="none" stroke="#7C6CFF" stroke-width="1.3" class="fade-cycle"/>
    <rect x="215" y="58" width="55" height="14" rx="3" fill="none" stroke="#7C6CFF" stroke-width="1.3" class="fade-cycle" style="animation-delay:.4s"/>
    <rect x="215" y="81" width="40" height="14" rx="3" fill="none" stroke="#7C6CFF" stroke-width="1.3" class="fade-cycle" style="animation-delay:.8s"/>
  </svg>`,

  // 6. Predictive Analytics & Forecasting — curve + projection
  () => `${svgOpen()}
    <polyline points="25,100 60,85 95,95 130,60 165,70 200,40" fill="none" stroke="#6FE3FF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="200,40 230,30 260,15 280,8" fill="none" stroke="#7C6CFF" stroke-width="2.2" stroke-dasharray="4 5" stroke-linecap="round" stroke-linejoin="round" class="flow-dash"/>
    <circle cx="200" cy="40" r="4" fill="#6FE3FF"/>
    <circle cx="260" cy="15" r="4" fill="#7C6CFF" class="pulse-dot"/>
    <circle cx="280" cy="8" r="4" fill="#7C6CFF" class="pulse-dot" style="animation-delay:.5s"/>
  </svg>`,

  // 7. Cloud AI Pipelines & Deployment
  () => `${svgOpen()}
    <path d="M60,70 a16,16 0 0 1 0,-32 a20,20 0 0 1 38,-6 a18,18 0 0 1 6,38 Z" fill="none" stroke="#6FE3FF" stroke-width="1.4" transform="translate(0,10)"/>
    <path class="flow-dash" d="M100,80 H160" stroke="#3E7BFA" stroke-width="2" fill="none"/>
    <rect x="165" y="60" width="34" height="34" rx="6" fill="#0E1735" stroke="#3E7BFA" stroke-width="1.3"/>
    <path class="flow-dash" d="M200,77 H240" stroke="#7C6CFF" stroke-width="2" fill="none" style="animation-delay:.4s"/>
    <circle cx="255" cy="77" r="14" fill="#0E1735" stroke="#7C6CFF" stroke-width="1.4" class="pulse-dot"/>
  </svg>`,

  // 8. Healthcare & Research AI Collaboration — medical scan
  () => `${svgOpen()}
    <rect x="90" y="25" width="70" height="98" rx="35" fill="none" stroke="#6FE3FF" stroke-width="1.3"/>
    <rect x="90" y="25" width="70" height="6" fill="#3E7BFA" opacity=".8">
      <animate attributeName="y" values="25;117;25" dur="3.2s" repeatCount="indefinite"/>
    </rect>
    <path d="M185,50 L200,50 L206,35 L214,70 L222,45 L228,50 L245,50" fill="none" stroke="#7C6CFF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // 9. Data Extraction & Integration — sources into unified lake
  () => `${svgOpen()}
    ${[30,52,74,96].map((y,i)=>`<circle cx="35" cy="${y+10}" r="5" fill="#0E1735" stroke="#6FE3FF" stroke-width="1.3"/><path class="flow-dash" d="M40,${y+10} Q110,${y+10} 150,75" fill="none" stroke="#6FE3FF" stroke-width="1.6" style="animation-delay:${i*0.25}s"/>`).join('')}
    <ellipse cx="185" cy="60" rx="34" ry="14" fill="none" stroke="#7C6CFF" stroke-width="1.4"/>
    <path d="M151,60 v28 a34,12 0 0 0 68,0 V60" fill="none" stroke="#7C6CFF" stroke-width="1.4"/>
    <ellipse cx="185" cy="60" rx="34" ry="14" fill="#7C6CFF" opacity=".12" class="fade-cycle"/>
  </svg>`,

  // 10. Custom AI Solutions — modules assembling
  () => `${svgOpen()}
    <g class="rise-fall"><rect x="40" y="55" width="34" height="34" rx="6" fill="none" stroke="#6FE3FF" stroke-width="1.4"/></g>
    <g class="rise-fall" style="animation-delay:.3s"><rect x="100" y="30" width="34" height="34" rx="6" fill="none" stroke="#3E7BFA" stroke-width="1.4"/></g>
    <g class="rise-fall" style="animation-delay:.6s"><rect x="100" y="80" width="34" height="34" rx="6" fill="none" stroke="#3E7BFA" stroke-width="1.4"/></g>
    <g class="rise-fall" style="animation-delay:.9s"><rect x="160" y="55" width="34" height="34" rx="6" fill="none" stroke="#7C6CFF" stroke-width="1.4"/></g>
    <line x1="74" y1="72" x2="100" y2="47" stroke="#6FE3FF" stroke-width="1" opacity=".5"/>
    <line x1="74" y1="72" x2="100" y2="97" stroke="#6FE3FF" stroke-width="1" opacity=".5"/>
    <line x1="134" y1="47" x2="160" y2="72" stroke="#3E7BFA" stroke-width="1" opacity=".5"/>
    <line x1="134" y1="97" x2="160" y2="72" stroke="#3E7BFA" stroke-width="1" opacity=".5"/>
    <circle cx="240" cy="72" r="12" fill="#0E1735" stroke="#6FE3FF" stroke-width="1.5" class="pulse-dot"/>
    <line x1="194" y1="72" x2="228" y2="72" stroke="#7C6CFF" stroke-width="1.2" opacity=".6"/>
  </svg>`,

  // 11. Trustworthy AI & Model Reliability — gauge + fairness scale
  () => `${svgOpen()}
    <g transform="translate(85,75)">
      <path d="M-40,0 A40,40 0 0 1 40,0" fill="none" stroke="#26345A" stroke-width="8" stroke-linecap="round"/>
      <path d="M-40,0 A40,40 0 0 1 20,-34" fill="none" stroke="#6FE3FF" stroke-width="8" stroke-linecap="round"/>
      <line x1="0" y1="0" x2="18" y2="-32" stroke="#F6F8FC" stroke-width="2.4" stroke-linecap="round">
        <animateTransform attributeName="transform" type="rotate" values="-15 0 0;15 0 0;-15 0 0" dur="3s" repeatCount="indefinite"/>
      </line>
      <circle r="4" fill="#F6F8FC"/>
    </g>
    <g transform="translate(210,45)" stroke="#7C6CFF" fill="none" stroke-width="1.4">
      <line x1="0" y1="0" x2="0" y2="55"/>
      <line x1="-45" y1="0" x2="45" y2="0" class="rise-fall"/>
      <line x1="-45" y1="0" x2="-45" y2="14"/>
      <line x1="45" y1="0" x2="45" y2="14"/>
      <path d="M-52,14 a10,7 0 0 0 14,0 Z" opacity=".6"/>
      <path d="M38,14 a10,7 0 0 0 14,0 Z" opacity=".6"/>
    </g>
  </svg>`,
];

const servicesData = [
  { title:'AI Workflow Automation', desc:'We automate repetitive business workflows using AI, Python, cloud tools, and smart data processing.', bullets:[
    'Automating repetitive office tasks','Connecting data from websites, databases, Excel files, PDFs, APIs, and cloud systems','Automating data cleaning, validation, and processing','Creating automatic alerts and notifications','Reducing manual data entry and repetitive reporting work','Integrating workflows across departments and business systems'
  ]},
  { title:'Excel & Report Automation', desc:'We replace manual reporting with automated, reliable systems.', bullets:[
    'Automatic Excel and PDF generation','Weekly and daily report automation','Data extraction from CSV files and web portals','Automated KPIs and summaries','Validation checks to reduce human error'
  ]},
  { title:'AI Consulting & Solution Design', desc:'We help businesses understand where AI and automation can bring real value before they invest in full development.', bullets:[
    'Automation opportunity assessment','AI feasibility study','Workflow analysis','Data readiness assessment','Technical architecture planning','Prototype planning','Project roadmap design','Cost and implementation estimation'
  ]},
  { title:'AI-Powered Dashboards', desc:'We build intelligent dashboards for live business insights.', bullets:[
    'PowerBI and Python-based visuals','Executive and sales KPI tracking','Real-time monitoring','Trend forecasting','AI-generated summaries','Database integration'
  ]},
  { title:'AI Document Intelligence', desc:'We extract, summarize, classify, and search business information using AI.', bullets:[
    'PDF and invoice data extraction','Automated report summarization','Document classification','Internal knowledge search systems','Automatic field extraction from files'
  ]},
  { title:'Predictive Analytics & Forecasting', desc:'We develop machine learning models to forecast trends and improve decisions.', bullets:[
    'Sales and demand forecasting','Workload and KPI predictions','Time-series trend analysis','Decision-support models','Operational optimization insights'
  ]},
  { title:'Cloud AI Pipelines & Deployment', desc:'We build scalable AI and data pipelines that connect data sources, machine learning models, APIs, dashboards, and business systems.', bullets:[
    'Cloud-based ML pipelines','API deployment','Batch and real-time inference','Data pipeline integration','Model deployment and monitoring','Scalable backend systems'
  ]},
  { title:'Healthcare & Research AI Collaboration', desc:'We support AI research and development in collaboration with universities, hospitals, and industry partners.', bullets:[
    'Medical imaging AI prototypes','Research model development','Synthetic data generation support','Evaluation of AI systems','Research code implementation','Collaboration with academic and clinical teams'
  ]},
  { title:'Data Extraction & Integration', desc:'We automate the collection and integration of data from multiple business sources.', bullets:[
    'Website and web portal data extraction','Internal website automation','Database connectivity','API integration','Excel and CSV data extraction','PDF and document data extraction','Cloud storage integration','Integration with other systems'
  ]},
  { title:'Custom AI Solutions', desc:'We design and deploy tailored AI systems for business problems that cannot be solved by standard tools.', bullets:[
    'Machine learning models','Classification and regression models','Predictive analytics','Anomaly detection systems','Recommendation systems','Decision-support models','Computer vision prototypes','Medical imaging AI prototypes','AI-powered data processing systems'
  ]},
  { title:'Trustworthy AI & Model Reliability', desc:'We help organizations evaluate AI systems for fairness, reliability, uncertainty, bias, and robustness.', bullets:[
    'Fairness evaluation','Bias detection','Robustness testing','Uncertainty estimation','Conformal prediction','Model reliability analysis','AI evaluation for sensitive domains','Responsible AI consulting'
  ]},
];

function buildServices(){
  const grid = document.getElementById('serviceGrid');
  grid.innerHTML = servicesData.map((s,i) => `
    <article class="service-card reveal tilt">
      <div class="sc-graphic">${serviceGraphics[i]()}</div>
      <div class="sc-body">
        <span class="sc-num">SERVICE ${String(i+1).padStart(2,'0')}</span>
        <h3>${s.title}</h3>
        <p class="sc-desc">${s.desc}</p>
        <ul class="sc-bullets">${s.bullets.map(b=>`<li>${b}</li>`).join('')}</ul>
        <button class="sc-toggle" type="button" aria-expanded="false">
          <span class="sc-toggle-text">View capabilities</span>
          <svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </article>`).join('');

  grid.querySelectorAll('.service-card').forEach(card => {
    const btn = card.querySelector('.sc-toggle');
    const txt = btn.querySelector('.sc-toggle-text');
    btn.addEventListener('click', () => {
      const open = card.classList.toggle('expanded');
      btn.setAttribute('aria-expanded', open);
      txt.textContent = open ? 'Hide capabilities' : 'View capabilities';
    });
    grid.appendChild(card);
    revealObserver.observe(card);
  });
}
buildServices();

/* ============================================================
   PRODUCT GRAPHICS — 8 unique mini mockups
   ============================================================ */
const productGraphics = [
  // 1 Automated Reporting System
  () => `${svgOpen('0 0 300 110')}
    <rect x="30" y="25" width="46" height="58" rx="3" fill="none" stroke="#6FE3FF" stroke-width="1.2"/>
    <line x1="36" y1="38" x2="70" y2="38" stroke="#6FE3FF" stroke-width="1" opacity=".5"/>
    <line x1="36" y1="50" x2="70" y2="50" stroke="#6FE3FF" stroke-width="1" opacity=".5"/>
    <path class="flow-dash" d="M80,54 H170" stroke="#3E7BFA" stroke-width="2" fill="none"/>
    <rect x="178" y="18" width="48" height="60" rx="4" fill="#0E1735" stroke="#7C6CFF" stroke-width="1.2"/>
    <rect x="188" y="48" width="6" height="18" fill="#6FE3FF" class="v-bar"/>
    <rect x="198" y="38" width="6" height="28" fill="#3E7BFA" class="v-bar" style="animation-delay:.2s"/>
    <rect x="208" y="30" width="6" height="36" fill="#7C6CFF" class="v-bar" style="animation-delay:.4s"/>
  </svg>`,
  // 2 AI Document Extraction Tool
  () => `${svgOpen('0 0 300 110')}
    <rect x="110" y="14" width="60" height="80" rx="4" fill="#0E1735" stroke="#6FE3FF" stroke-width="1.2"/>
    <rect x="110" y="14" width="60" height="4" fill="#3E7BFA">
      <animate attributeName="y" values="14;90;14" dur="2.8s" repeatCount="indefinite"/>
    </rect>
    <rect x="185" y="26" width="46" height="10" rx="2" fill="none" stroke="#7C6CFF" stroke-width="1.2" class="fade-cycle"/>
    <rect x="185" y="44" width="46" height="10" rx="2" fill="none" stroke="#7C6CFF" stroke-width="1.2" class="fade-cycle" style="animation-delay:.35s"/>
    <rect x="185" y="62" width="32" height="10" rx="2" fill="none" stroke="#7C6CFF" stroke-width="1.2" class="fade-cycle" style="animation-delay:.7s"/>
  </svg>`,
  // 3 Business KPI Dashboard
  () => `${svgOpen('0 0 300 110')}
    <rect x="40" y="18" width="220" height="74" rx="7" fill="#0E1735" stroke="#6FE3FF" stroke-width="1.2"/>
    <polyline points="60,68 90,50 120,60 150,32 180,44 210,24 240,36" fill="none" stroke="#6FE3FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="240" cy="36" r="3.5" fill="#6FE3FF" class="pulse-dot"/>
  </svg>`,
  // 4 Sales Forecasting System
  () => `${svgOpen('0 0 300 110')}
    <polyline points="30,80 70,66 110,74 150,44 185,54" fill="none" stroke="#6FE3FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="185,54 215,40 245,22 270,12" fill="none" stroke="#7C6CFF" stroke-width="2" stroke-dasharray="4 5" class="flow-dash" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="185" cy="54" r="3.5" fill="#6FE3FF"/>
    <circle cx="270" cy="12" r="3.5" fill="#7C6CFF" class="pulse-dot"/>
  </svg>`,
  // 5 Internal Knowledge Search Assistant
  () => `${svgOpen('0 0 300 110')}
    ${[[80,30],[80,55],[80,80]].map((p,i)=>`<rect x="${p[0]}" y="${p[1]-8}" width="60" height="16" rx="3" fill="none" stroke="#3E7BFA" stroke-width="1.1" opacity="${i===1?1:.4}"/>`).join('')}
    <g transform="translate(200,55)">
      <circle r="22" fill="none" stroke="#6FE3FF" stroke-width="2"/>
      <line x1="16" y1="16" x2="30" y2="30" stroke="#6FE3FF" stroke-width="2.4" stroke-linecap="round"/>
      <circle r="22" fill="none" stroke="#6FE3FF" stroke-width="1" class="pulse-dot" opacity=".5"/>
    </g>
  </svg>`,
  // 6 AI Customer Support Chatbot
  () => `${svgOpen('0 0 300 110')}
    <rect x="40" y="20" width="90" height="42" rx="12" fill="none" stroke="#3E7BFA" stroke-width="1.3"/>
    <path d="M55,62 l0,14 l16,-14" fill="none" stroke="#3E7BFA" stroke-width="1.3"/>
    <circle cx="65" cy="41" r="3" fill="#3E7BFA" class="fade-cycle"/><circle cx="85" cy="41" r="3" fill="#3E7BFA" class="fade-cycle" style="animation-delay:.3s"/><circle cx="105" cy="41" r="3" fill="#3E7BFA" class="fade-cycle" style="animation-delay:.6s"/>
    <rect x="170" y="46" width="90" height="38" rx="12" fill="#0E1735" stroke="#6FE3FF" stroke-width="1.3"/>
    <path d="M245,84 l0,12 l-16,-12" fill="#0E1735" stroke="#6FE3FF" stroke-width="1.3"/>
    <line x1="188" y1="60" x2="242" y2="60" stroke="#6FE3FF" stroke-width="1.4" opacity=".6"/>
    <line x1="188" y1="70" x2="222" y2="70" stroke="#6FE3FF" stroke-width="1.4" opacity=".6"/>
  </svg>`,
  // 7 Data Cleaning and Validation Tool
  () => `${svgOpen('0 0 300 110')}
    ${[0,1,2,3].map(i=>`<g transform="translate(70,${20+i*20})">
      <rect width="150" height="14" rx="3" fill="none" stroke="#3E7BFA" stroke-width="1" opacity=".5"/>
      <path class="v-check" d="M158,7 L163,12 L172,2" stroke="#6FE3FF" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="animation-delay:${i*0.4}s"/>
    </g>`).join('')}
  </svg>`,
  // 8 Healthcare AI Research Prototype
  () => `${svgOpen('0 0 300 110')}
    <rect x="115" y="10" width="70" height="90" rx="30" fill="none" stroke="#6FE3FF" stroke-width="1.2"/>
    <rect x="115" y="10" width="70" height="6" fill="#7C6CFF" opacity=".8">
      <animate attributeName="y" values="10;94;10" dur="3s" repeatCount="indefinite"/>
    </rect>
    <path d="M200,45 L212,45 L218,30 L226,62 L234,38 L240,45 L255,45" fill="none" stroke="#3E7BFA" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
];

const productsData = [
  { title:'Automated Reporting System', problem:'Manual weekly and monthly reports drain hours and introduce errors.', features:'Scheduled generation, automatic KPIs, Excel/PDF export, validation checks.', ideal:'Operations & finance teams' },
  { title:'AI Document Extraction Tool', problem:'Invoices, forms, and contracts require slow manual data entry.', features:'Automatic field extraction, PDF/invoice parsing, structured export.', ideal:'Finance & back-office teams' },
  { title:'Business KPI Dashboard', problem:'Metrics live in scattered spreadsheets with no single source of truth.', features:'PowerBI/Python visuals, real-time monitoring, AI-generated summaries.', ideal:'Executives & sales leaders' },
  { title:'Sales Forecasting System', problem:'Demand planning relies on guesswork instead of data.', features:'Time-series forecasting, trend analysis, decision-support outputs.', ideal:'Sales, retail & operations teams' },
  { title:'Internal Knowledge Search Assistant', problem:'Teams waste time searching scattered internal documents.', features:'AI-powered search, document classification, summarized answers.', ideal:'Large internal knowledge bases' },
  { title:'AI Customer Support Chatbot', problem:'Support teams face repetitive, high-volume inquiries.', features:'Automated responses, knowledge-base integration, escalation logic.', ideal:'Customer service & e-commerce' },
  { title:'Data Cleaning and Validation Tool', problem:'Inconsistent data undermines reporting and analytics.', features:'Automated cleaning rules, validation checks, error flagging.', ideal:'Teams merging multi-source data' },
  { title:'Healthcare AI Research Prototype', problem:'Research teams need reliable prototypes to test AI hypotheses.', features:'Medical imaging models, synthetic data support, evaluation tooling.', ideal:'Hospitals, universities & clinics' },
];

function buildProducts(){
  const grid = document.getElementById('productGrid');
  grid.innerHTML = productsData.map((p,i) => `
    <article class="product-card reveal tilt">
      <div class="pc-graphic">${productGraphics[i]()}</div>
      <div class="pc-body">
        <h3>${p.title}</h3>
        <p class="pc-problem">${p.problem}</p>
        <p class="pc-features">${p.features}</p>
        <p class="pc-ideal">${p.ideal.toUpperCase()}</p>
      </div>
    </article>`).join('');
  grid.querySelectorAll('.product-card').forEach(c => revealObserver.observe(c));
}
buildProducts();

/* ============================================================
   INDUSTRIES
   ============================================================ */
const industriesData = [
  { name:'Small & Medium Businesses', icon:'<path d="M6 21V10l9-6 9 6v11" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 21v-7h8v7" fill="none" stroke="currentColor" stroke-width="1.6"/>' },
  { name:'Healthcare & Medical Research', icon:'<path d="M4 12h4l2-6 4 12 2-6h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' },
  { name:'Retail & E-commerce', icon:'<circle cx="10" cy="20" r="1.4" fill="currentColor"/><circle cx="18" cy="20" r="1.4" fill="currentColor"/><path d="M3 4h3l2.4 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L22 8H6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' },
  { name:'Real Estate', icon:'<path d="M4 21V9l8-6 8 6v12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><rect x="10" y="13" width="4" height="8" fill="none" stroke="currentColor" stroke-width="1.4"/>' },
  { name:'Operations & Logistics', icon:'<rect x="2" y="9" width="13" height="8" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M15 12h4l3 3v2h-7z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="7" cy="19" r="1.8" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="18" cy="19" r="1.8" fill="none" stroke="currentColor" stroke-width="1.4"/>' },
  { name:'Education & Research', icon:'<path d="M2 9l10-5 10 5-10 5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" fill="none" stroke="currentColor" stroke-width="1.6"/>' },
  { name:'Finance & Reporting Teams', icon:'<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 7v10M9 9.5c0-1.4 1.3-2.5 3-2.5s3 1 3 2.2c0 3-6 1.5-6 4.3 0 1.3 1.3 2.5 3 2.5s3-1.1 3-2.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' },
  { name:'Telecom & Technical Services', icon:'<path d="M4 20l4-8 4 4 4-9 4 13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="4" cy="20" r="1.3" fill="currentColor"/>' },
];

function buildIndustries(){
  const grid = document.getElementById('industryGrid');
  grid.innerHTML = industriesData.map(ind => `
    <div class="industry-card reveal">
      <svg viewBox="0 0 24 24">${ind.icon}</svg>
      <span>${ind.name}</span>
    </div>`).join('');
  grid.querySelectorAll('.industry-card').forEach(c => revealObserver.observe(c));
}
buildIndustries();

/* ============================================================
   PROCESS TIMELINE
   ============================================================ */
const processData = [
  { t:'Discovery Call', d:'Understand your goals and current workflow.' },
  { t:'Workflow & Data Analysis', d:'Map data sources and manual bottlenecks.' },
  { t:'Solution Design', d:'Architect the automation and AI approach.' },
  { t:'Prototype Development', d:'Build a working proof of concept.' },
  { t:'Full Implementation', d:'Develop and integrate the complete system.' },
  { t:'Deployment & Support', d:'Launch, monitor, and continuously improve.' },
];
function buildProcess(){
  const track = document.getElementById('processTrack');
  track.innerHTML = processData.map((s,i) => `
    <div class="process-step reveal">
      <div class="ps-line"></div>
      <div class="ps-node">${String(i+1).padStart(2,'0')}</div>
      <h4>${s.t}</h4>
      <p>${s.d}</p>
    </div>`).join('');
  track.querySelectorAll('.process-step').forEach(c => revealObserver.observe(c));
}
buildProcess();

/* ============================================================
   ABOUT — ORBIT SKILL BADGES
   ============================================================ */
const skills = ['Python','Machine Learning','Deep Learning','AWS','SageMaker','S3','Boto3','PySpark','Kafka','FastAPI','Flask','PowerBI'];
function buildOrbit(){
  const wrap = document.getElementById('orbitWrap');
  const W = 460, H = 380, cx = W/2, cy = H/2;

  // Two elliptical rings sized to give long labels room — radii tuned per-ring
  // so badge arc-spacing exceeds badge width and nothing overlaps.
  const ringConfigs = [
    { rx:150, ry:80,  items: skills.slice(0,5) },
    { rx:225, ry:150, items: skills.slice(5) },
  ];

  let html = `
    <div class="orbit-ring" style="width:${300}px;height:${160}px;left:50%;top:50%;transform:translate(-50%,-50%);"></div>
    <div class="orbit-ring" style="width:${450}px;height:${300}px;left:50%;top:50%;transform:translate(-50%,-50%);"></div>
    <div class="orbit-core">AI &amp;<br>AUTOMATION</div>`;

  ringConfigs.forEach(rc => {
    const n = rc.items.length;
    rc.items.forEach((label,i) => {
      // offset start angle per ring so badges interleave rather than stack vertically
      const angle = (i/n)*Math.PI*2 - Math.PI/2 + (rc.rx>200 ? Math.PI/rc.items.length : 0);
      const x = Math.cos(angle)*rc.rx;
      const y = Math.sin(angle)*rc.ry;
      const delay = (i*0.35).toFixed(2);
      html += `<div class="orbit-badge-pos" style="left:calc(50% + ${x.toFixed(1)}px); top:calc(50% + ${y.toFixed(1)}px);"><span class="orbit-badge rise-fall" style="animation-delay:${delay}s;">${label}</span></div>`;
    });
  });
  wrap.innerHTML = html;
}
buildOrbit();

/* ============================================================
   RESEARCH VISUAL
   ============================================================ */
function buildResearch(){
  const wrap = document.getElementById('researchVisual');
  wrap.innerHTML = `${svgOpen('0 0 500 340')}
    <rect x="170" y="40" width="160" height="260" rx="70" fill="none" stroke="#7C6CFF" stroke-width="1.4" opacity=".8"/>
    <rect x="170" y="40" width="160" height="10" fill="#6FE3FF" opacity=".85">
      <animate attributeName="y" values="40;290;40" dur="4s" repeatCount="indefinite"/>
    </rect>
    <path d="M60,170 L100,170 L112,130 L130,220 L148,150 L162,170 L200,170" fill="none" stroke="#6FE3FF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>
    <path d="M300,170 L340,170 L352,140 L368,205 L384,155 L398,170 L440,170" fill="none" stroke="#3E7BFA" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>
    <g font-family="JetBrains Mono, monospace" font-size="10" fill="#8D96AA">
      <text x="60" y="255">FAIRNESS</text>
      <rect x="60" y="262" width="70" height="5" rx="2.5" fill="#14203F"/>
      <rect x="60" y="262" width="52" height="5" rx="2.5" fill="#6FE3FF" class="fade-cycle"/>
      <text x="340" y="255">CONFIDENCE</text>
      <rect x="340" y="262" width="80" height="5" rx="2.5" fill="#14203F"/>
      <rect x="340" y="262" width="64" height="5" rx="2.5" fill="#7C6CFF" class="fade-cycle" style="animation-delay:.5s"/>
    </g>
  </svg>`;
}
buildResearch();

/* ============================================================
   ANIMATED COUNTERS
   ============================================================ */
const counters = document.querySelectorAll('[data-count]');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if(en.isIntersecting){
      const el = en.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const dur = 1400;
      const start = performance.now();
      function tick(now){
        const p = Math.min(1, (now-start)/dur);
        const val = Math.floor(p * target);
        el.textContent = val + suffix;
        if(p < 1) requestAnimationFrame(tick); else el.textContent = target + suffix;
      }
      if(reduceMotion){ el.textContent = target + suffix; } else { requestAnimationFrame(tick); }
      counterObserver.unobserve(el);
    }
  });
}, { threshold:0.5 });
counters.forEach(c => counterObserver.observe(c));

/* ============================================================
   DEMO VIDEO SECTION — canvas fallback "video" animation
   ============================================================ */
function buildDemoCanvas(){
  const cv = document.getElementById('demoCanvas');
  const dctx = cv.getContext('2d');
  const playBtn = document.getElementById('demoPlayA');
  const video = document.getElementById('demoVideoA');
  const fallback = document.getElementById('demoFallbackA');

  function resize(){
    const r = cv.parentElement.getBoundingClientRect();
    cv.width = r.width * devicePixelRatio;
    cv.height = r.height * devicePixelRatio;
    dctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  }
  resize();
  window.addEventListener('resize', resize);

  const lanes = 5;
  let packets = Array.from({length:16}, () => ({
    lane: Math.floor(Math.random()*lanes),
    t: Math.random(),
    speed: 0.0025 + Math.random()*0.0025,
    stage: Math.random() < 0.5 ? 'in' : 'out'
  }));

  function draw(){
    const r = cv.parentElement.getBoundingClientRect();
    const w = r.width, h = r.height;
    dctx.clearRect(0,0,w,h);
    dctx.fillStyle = '#060B1A';
    dctx.fillRect(0,0,w,h);

    const cx = w*0.5, cy = h*0.5;
    // grid dots
    dctx.strokeStyle = 'rgba(148,196,255,0.06)';
    for(let x=0;x<w;x+=40){ dctx.beginPath(); dctx.moveTo(x,0); dctx.lineTo(x,h); dctx.stroke(); }

    // engine glow
    const grad = dctx.createRadialGradient(cx,cy,4,cx,cy,90);
    grad.addColorStop(0,'rgba(111,227,255,0.55)');
    grad.addColorStop(1,'rgba(111,227,255,0)');
    dctx.fillStyle = grad;
    dctx.beginPath(); dctx.arc(cx,cy,90,0,Math.PI*2); dctx.fill();
    dctx.fillStyle = '#0E1735';
    dctx.strokeStyle = '#6FE3FF'; dctx.lineWidth=1.4;
    dctx.beginPath(); dctx.arc(cx,cy,22,0,Math.PI*2); dctx.fill(); dctx.stroke();

    const laneY = i => (h*0.18) + i*((h*0.64)/(lanes-1));

    packets.forEach(p => {
      p.t += p.speed;
      if(p.t > 1) p.t = 0;
      let x,y;
      if(p.stage === 'in'){
        const y0 = laneY(p.lane), x0 = w*0.06, x1 = cx-24;
        x = x0 + (x1-x0)*p.t;
        y = y0 + (cy-y0)*p.t;
      } else {
        const y1 = laneY(p.lane), x0 = cx+24, x1 = w*0.94;
        x = x0 + (x1-x0)*p.t;
        y = cy + (y1-cy)*p.t;
      }
      dctx.beginPath();
      dctx.fillStyle = p.stage==='in' ? 'rgba(111,227,255,0.9)' : 'rgba(124,108,255,0.9)';
      dctx.arc(x,y,2.6,0,Math.PI*2);
      dctx.fill();
    });

    if(!reduceMotion) requestAnimationFrame(draw);
  }
  draw();

  playBtn.addEventListener('click', () => {
    video.play().then(() => {
      fallback.style.display = 'none';
      playBtn.classList.add('hidden');
    }).catch(() => {
      // no real video file present — keep canvas animation as the visual
      playBtn.classList.add('hidden');
    });
  });
}
buildDemoCanvas();

/* ============================================================
   CONTACT FORM — SAVE TO DATABASE, THEN OPEN WHATSAPP
   ============================================================ */
const form = document.getElementById("contactForm");
const note = document.getElementById("formNote");

const WHATSAPP_NUMBER = "393409050330"; // your WhatsApp number without +
const API_BASE_URL = window.RETINA_API_BASE_URL || window.FLOWTICA_API_BASE_URL || "";

function buildWhatsAppUrl(message) {
  return `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;
}

function showWhatsAppButton(whatsappUrl, savedId) {
  if (!note) return;

  note.innerHTML = `
    <strong>Your request has been saved${savedId ? ` with ID #${savedId}` : ""}.</strong>
    <br><br>
    Please click the button below to send the same request on WhatsApp.
    <br><br>
    <a href="${whatsappUrl}"
       target="_blank"
       rel="noopener noreferrer"
       class="btn btn-primary">
      Open WhatsApp and Send Message
    </a>
    <br><br>
    <small>If WhatsApp asks you to log in, log in first, then come back and click this button again.</small>
  `;
}

if (form) {
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.textContent : "Book a Free Consultation";
    const data = new FormData(form);

    const payload = {
      name: (data.get("name") || "").trim(),
      email: (data.get("email") || "").trim(),
      company: (data.get("company") || "").trim(),
      service: (data.get("service") || "").trim(),
      message: (data.get("message") || "").trim(),
      source_page: window.location.href
    };

    const whatsappMessage =
`Hello Retina Networks,

I want to book a free consultation.

Name: ${payload.name}
Email: ${payload.email}
Company: ${payload.company || "-"}
Service: ${payload.service || "-"}

Project details:
${payload.message}`;

    const whatsappUrl = buildWhatsAppUrl(whatsappMessage);

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Saving request...";
    }

    if (note) {
      note.textContent = "Saving your request securely...";
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.detail || "Your request could not be saved.");
      }

      showWhatsAppButton(whatsappUrl, result.id);

      // Try to open WhatsApp after saving. If the browser blocks it, the button above remains available.
      const opened = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      if (!opened && note) {
        note.innerHTML += `<br><small>Your browser blocked the automatic WhatsApp window. Please use the button above.</small>`;
      }

      form.reset();

    } catch (error) {
      console.error("Contact form error:", error);

      if (note) {
        note.innerHTML = `
          <strong>Sorry, your request could not be saved in the database.</strong>
          <br><br>
          You can still contact us on WhatsApp:
          <br><br>
          <a href="${whatsappUrl}"
             target="_blank"
             rel="noopener noreferrer"
             class="btn btn-primary">
            Open WhatsApp
          </a>
        `;
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
  });
}



})();
