/**
 * Realistic 3D White Paper Animations — Kalla Police Game
 *
 * ShuffleAnimation : Three.js white papers that shuffle, fan & deal.
 * PaperAnimation   : (legacy) single-paper role-reveal unfold.
 *
 * Both exposed on window.* for game.js to call.
 */

/* ═══════════════════════════════════════════════════════════
   SHARED UTILITIES
═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── tiny seeded noise ─────────────────────────────────────
  function hash(n) { const x = Math.sin(n) * 43758.5453; return x - Math.floor(x); }
  function noise2(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = hash(ix + iy * 57), b = hash(ix + 1 + iy * 57);
    const c = hash(ix + (iy + 1) * 57), d = hash(ix + 1 + (iy + 1) * 57);
    return a + (b - a) * ux + (c - a) * uy + (d - a + b - b - c + a) * ux * uy;
  }

  /* ═══════════════════════════════════════════════════════════
     1.  WHITE PAPER CANVAS TEXTURE BUILDER
         Crisp, bright office-paper look with subtle ruled lines,
         micro-fiber texture, and soft watermark.
  ═══════════════════════════════════════════════════════════ */
  function buildWhitePaperCanvas(opts) {
    opts = opts || {};
    const W = 512, H = 724;   // A4-ish ratio
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');

    // ── bright white base ──────────────────────────────────────
    const baseGrad = ctx.createLinearGradient(0, 0, W, H);
    baseGrad.addColorStop(0,   '#ffffff');
    baseGrad.addColorStop(0.4, '#f8f9ff');
    baseGrad.addColorStop(0.8, '#f5f5f8');
    baseGrad.addColorStop(1,   '#ebebf0');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, W, H);

    // ── subtle blue ruled lines (like lined paper) ─────────────
    if (!opts.plain) {
      ctx.strokeStyle = 'rgba(100,130,220,0.07)';
      ctx.lineWidth = 0.8;
      for (let y = 60; y < H - 20; y += 22) {
        ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(W - 20, y); ctx.stroke();
      }
      // margin line
      ctx.strokeStyle = 'rgba(220,100,100,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(60, 20); ctx.lineTo(60, H - 20); ctx.stroke();
    }

    // ── micro paper fiber noise ────────────────────────────────
    for (let i = 0; i < 1800; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      const len = Math.random() * 12 + 2;
      const ang = (Math.random() - 0.5) * 0.5;
      const alpha = Math.random() * 0.04 + 0.01;
      ctx.strokeStyle = Math.random() > 0.6
        ? `rgba(80,100,160,${alpha})`
        : `rgba(180,180,190,${alpha})`;
      ctx.lineWidth = Math.random() * 0.6 + 0.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
      ctx.stroke();
    }

    // ── very subtle noise patches ──────────────────────────────
    for (let px = 0; px < W; px += 6) {
      for (let py = 0; py < H; py += 6) {
        const n = noise2(px / 60, py / 60);
        if (n < 0.35 || n > 0.65) {
          const col = n > 0.5 ? 255 : 210;
          ctx.fillStyle = `rgba(${col},${col},${col+10},${Math.abs(n - 0.5) * 0.06})`;
          ctx.fillRect(px, py, 6, 6);
        }
      }
    }

    // ── fold crease across middle ─────────────────────────────
    const cy = H / 2;
    const cg = ctx.createLinearGradient(0, cy - 5, 0, cy + 5);
    cg.addColorStop(0,   'rgba(255,255,255,0)');
    cg.addColorStop(0.4, 'rgba(200,210,255,0.12)');
    cg.addColorStop(0.5, 'rgba(140,150,200,0.18)');
    cg.addColorStop(0.6, 'rgba(200,210,255,0.08)');
    cg.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = cg;
    ctx.fillRect(0, cy - 5, W, 10);

    // ── subtle vignette (edges slightly darker) ────────────────
    const vg = ctx.createRadialGradient(W/2, H/2, W*0.25, W/2, H/2, W*0.8);
    vg.addColorStop(0, 'rgba(255,255,255,0)');
    vg.addColorStop(1, 'rgba(160,160,180,0.12)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // ── edge shadow (slight depth on right/bottom) ────────────
    const rg = ctx.createLinearGradient(W - 20, 0, W, 0);
    rg.addColorStop(0, 'rgba(180,180,200,0)');
    rg.addColorStop(1, 'rgba(180,180,200,0.15)');
    ctx.fillStyle = rg; ctx.fillRect(W - 20, 0, 20, H);
    const bg = ctx.createLinearGradient(0, H - 20, 0, H);
    bg.addColorStop(0, 'rgba(180,180,200,0)');
    bg.addColorStop(1, 'rgba(180,180,200,0.15)');
    ctx.fillStyle = bg; ctx.fillRect(0, H - 20, W, 20);

    // ── optional small back-side tint ─────────────────────────
    if (opts.back) {
      ctx.fillStyle = 'rgba(230,235,255,0.35)';
      ctx.fillRect(0, 0, W, H);
    }

    return c;
  }

  /* ═══════════════════════════════════════════════════════════
     2.  SHUFFLE ANIMATION  (Three.js)
         N white paper cards fly in, shuffle chaotically, then
         fan out into a neat arc the player count wide.
  ═══════════════════════════════════════════════════════════ */
  let shuffleScene = null, shuffleRenderer = null, shuffleCamera = null;
  let shuffleRaf = null, shuffleClock = null;
  let shuffleCards = [];   // { mesh, target, vel, phase, phaseT }
  let shufflePhase = 'idle';   // idle | fly-in | chaos | fan | hold
  let shufflePhaseTime = 0;
  let shuffleOnDone = null;
  let shuffleContainer = null;
  let shufflePlayerCount = 4;

  const CARD_W = 1.0, CARD_H = 1.4;

  function buildCardMesh(renderer, isBack) {
    const tex = new THREE.CanvasTexture(buildWhitePaperCanvas({ plain: true, back: !!isBack }));
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const geo = new THREE.PlaneGeometry(CARD_W, CARD_H, 4, 6);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.75,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function initShuffleScene(containerEl, playerCount) {
    shuffleContainer = containerEl;
    shufflePlayerCount = playerCount;
    const W = containerEl.clientWidth  || 360;
    const H = containerEl.clientHeight || 260;

    shuffleScene = new THREE.Scene();
    shuffleScene.background = null;

    shuffleCamera = new THREE.PerspectiveCamera(50, W / H, 0.1, 60);
    shuffleCamera.position.set(0, 0, 8);

    shuffleRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    shuffleRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    shuffleRenderer.setSize(W, H);
    shuffleRenderer.shadowMap.enabled = true;
    shuffleRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    shuffleRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    shuffleRenderer.toneMappingExposure = 1.3;
    containerEl.appendChild(shuffleRenderer.domElement);

    // ── Lights ──────────────────────────────────────────────
    shuffleScene.add(new THREE.AmbientLight(0xffffff, 0.7));

    const sun = new THREE.DirectionalLight(0xfff8f5, 2.2);
    sun.position.set(4, 8, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -8; sun.shadow.camera.right = 8;
    sun.shadow.camera.top  =  6; sun.shadow.camera.bottom= -6;
    sun.shadow.bias = -0.002;
    shuffleScene.add(sun);

    const fill = new THREE.DirectionalLight(0xd0e8ff, 0.9);
    fill.position.set(-5, 2, 4);
    shuffleScene.add(fill);

    const rim = new THREE.DirectionalLight(0xffd0a0, 0.5);
    rim.position.set(0, -4, -3);
    shuffleScene.add(rim);

    // ── Shadow plane ─────────────────────────────────────────
    const sp = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.ShadowMaterial({ opacity: 0.20, transparent: true })
    );
    sp.rotation.x = -Math.PI / 2;
    sp.position.y = -2.2;
    sp.receiveShadow = true;
    shuffleScene.add(sp);

    // ── Cards ────────────────────────────────────────────────
    shuffleCards = [];
    for (let i = 0; i < playerCount; i++) {
      const mesh = buildCardMesh(shuffleRenderer, false);
      // Start high above & off-screen
      mesh.position.set((Math.random() - 0.5) * 4, 9 + i * 0.6, (Math.random() - 0.5) * 0.5);
      mesh.rotation.set(
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * Math.PI
      );
      shuffleScene.add(mesh);
      shuffleCards.push({
        mesh,
        vel: { x: 0, y: 0, rz: 0 },
        startDelay: i * 0.07,
        flownIn: false,
      });
    }

    shuffleClock = new THREE.Clock();
  }

  function fanPosition(i, total) {
    // Spread cards in a neat horizontal arc
    const spread = Math.min(total * 0.55, 4.5);
    const x = total > 1 ? (i / (total - 1) - 0.5) * spread * 2 : 0;
    const arcY = -Math.pow(x / (spread + 0.5), 2) * 0.4;
    const rotZ = total > 1 ? -(i / (total - 1) - 0.5) * 0.35 : 0;
    return { x, y: arcY - 0.3, z: i * 0.005, rotZ, rotX: 0.08, rotY: 0 };
  }

  function runShuffleTick() {
    shuffleRaf = requestAnimationFrame(runShuffleTick);
    const dt = Math.min(shuffleClock.getDelta(), 0.05);
    shufflePhaseTime += dt;

    const t = shufflePhaseTime;

    if (shufflePhase === 'fly-in') {
      let allIn = true;
      shuffleCards.forEach((card, i) => {
        const elapsed = t - card.startDelay;
        if (elapsed < 0) { allIn = false; return; }
        const ft = Math.min(elapsed / 0.55, 1);
        const ease = ft < 0.5 ? 2 * ft * ft : 1 - Math.pow(-2 * ft + 2, 3) / 8;
        // Fly in from top to center-chaos position
        const tx = (i % 2 === 0 ? -1 : 1) * (1 + Math.random() * 0.3);
        const ty = (Math.random() - 0.5) * 0.8;
        card.mesh.position.x = THREE.MathUtils.lerp(card.mesh.position.x, tx, ease * 0.25);
        card.mesh.position.y = THREE.MathUtils.lerp(card.mesh.position.y, ty, ease * 0.25);
        card.mesh.position.z = THREE.MathUtils.lerp(card.mesh.position.z, 0, ease * 0.2);
        card.mesh.rotation.z += (Math.random() - 0.5) * 0.06 * (1 - ease);
        if (ft >= 1) card.flownIn = true; else allIn = false;
      });
      if (allIn) { shufflePhase = 'chaos'; shufflePhaseTime = 0; }

    } else if (shufflePhase === 'chaos') {
      // Rapid chaotic shuffling — cards swap and spin
      shuffleCards.forEach((card, i) => {
        const wave = Math.sin(t * 8 + i * 1.3) * 0.9;
        const wave2 = Math.cos(t * 7 + i * 2.1) * 0.5;
        card.mesh.position.x = wave * (i % 2 === 0 ? 1 : -1) * 0.7;
        card.mesh.position.y = wave2 * 0.4;
        card.mesh.position.z = Math.sin(t * 6 + i) * 0.25;
        card.mesh.rotation.z = wave * 0.55;
        card.mesh.rotation.x = Math.cos(t * 5 + i) * 0.18;
        card.mesh.rotation.y = Math.sin(t * 4 + i * 1.7) * 0.22;
      });
      if (t > 1.6) { shufflePhase = 'fan'; shufflePhaseTime = 0; }

    } else if (shufflePhase === 'fan') {
      const fanT = Math.min(t / 1.1, 1);
      const ease = fanT < 0.5 ? 4 * fanT * fanT * fanT : 1 - Math.pow(-2 * fanT + 2, 3) / 2;
      shuffleCards.forEach((card, i) => {
        const fp = fanPosition(i, shufflePlayerCount);
        // Smooth chaos → fan
        const chaosMix = 1 - ease;
        const chaosX = Math.sin(t * 8 + i * 1.3) * 0.9 * chaosMix;
        const chaosY = Math.cos(t * 7 + i * 2.1) * 0.4 * chaosMix;
        card.mesh.position.x = THREE.MathUtils.lerp(card.mesh.position.x, fp.x + chaosX, ease * 0.18);
        card.mesh.position.y = THREE.MathUtils.lerp(card.mesh.position.y, fp.y + chaosY, ease * 0.18);
        card.mesh.position.z = THREE.MathUtils.lerp(card.mesh.position.z, fp.z, ease * 0.2);
        card.mesh.rotation.z = THREE.MathUtils.lerp(card.mesh.rotation.z, fp.rotZ, ease * 0.15);
        card.mesh.rotation.x = THREE.MathUtils.lerp(card.mesh.rotation.x, fp.rotX, ease * 0.15);
        card.mesh.rotation.y = THREE.MathUtils.lerp(card.mesh.rotation.y, fp.rotY, ease * 0.15);
      });
      if (fanT >= 1) {
        shufflePhase = 'hold';
        shufflePhaseTime = 0;
        if (shuffleOnDone) { shuffleOnDone(); shuffleOnDone = null; }
      }

    } else if (shufflePhase === 'hold') {
      // Gentle idle float — cards breathe
      shuffleCards.forEach((card, i) => {
        const fp = fanPosition(i, shufflePlayerCount);
        const breathe = Math.sin(t * 1.1 + i * 0.6) * 0.018;
        card.mesh.position.y = fp.y + breathe;
        card.mesh.rotation.x = fp.rotX + breathe * 0.3;
        card.mesh.rotation.z = fp.rotZ + Math.sin(t * 0.8 + i) * 0.005;
      });
    }

    shuffleRenderer.render(shuffleScene, shuffleCamera);
  }

  function destroyShuffleAnimation() {
    if (shuffleRaf) { cancelAnimationFrame(shuffleRaf); shuffleRaf = null; }
    window.removeEventListener('resize', onShuffleResize);
    if (shuffleRenderer) {
      shuffleRenderer.dispose();
      if (shuffleRenderer.domElement && shuffleRenderer.domElement.parentNode) {
        shuffleRenderer.domElement.parentNode.removeChild(shuffleRenderer.domElement);
      }
      shuffleRenderer = null;
    }
    shuffleCards.forEach(c => {
      if (c.mesh) {
        c.mesh.geometry.dispose();
        if (Array.isArray(c.mesh.material)) c.mesh.material.forEach(m => m.dispose());
        else c.mesh.material.dispose();
      }
    });
    shuffleCards = [];
    shuffleScene = null; shuffleCamera = null;
    shufflePhase = 'idle'; shufflePhaseTime = 0;
    shuffleContainer = null;
  }

  function onShuffleResize() {
    if (!shuffleContainer || !shuffleRenderer || !shuffleCamera) return;
    const W = shuffleContainer.clientWidth;
    const H = shuffleContainer.clientHeight;
    shuffleCamera.aspect = W / H;
    shuffleCamera.updateProjectionMatrix();
    shuffleRenderer.setSize(W, H);
  }

  window.ShuffleAnimation = {
    /**
     * Play the shuffle animation.
     * @param {HTMLElement} containerEl   - Where to mount the canvas
     * @param {number}      playerCount   - How many paper cards to show
     * @param {Function}    onDone        - Called when fan layout is complete (ready to play)
     */
    play(containerEl, playerCount, onDone) {
      this.destroy();
      initShuffleScene(containerEl, playerCount);
      shuffleOnDone = onDone || null;
      shufflePhase = 'fly-in';
      shufflePhaseTime = 0;
      window.addEventListener('resize', onShuffleResize);
      runShuffleTick();
    },

    destroy: destroyShuffleAnimation
  };

  /* ═══════════════════════════════════════════════════════════
     3.  SINGLE-PAPER REVEAL ANIMATION  (Legacy / kept for use)
         A single white paper drops, unfolds, and reveals content
         written on it (the role card). Roles are now SECRET so
         this draws a plain sealed paper with a wax seal graphic.
  ═══════════════════════════════════════════════════════════ */
  const PAPER_W = 2.0, PAPER_H = 2.8, FOLD_SEGS = 28;

  let scene, camera, renderer, paperMesh, shadowPlane;
  let clock2, animPhase = 'idle', phaseTime = 0;
  let onRevealCallback = null;
  let rafId = null;
  let paperContainer = null;

  function buildSealedPaperCanvas() {
    const W = 512, H = 720;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');

    // bright white base
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#f0f0f5');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // fiber noise
    for (let i = 0; i < 1200; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      const len = Math.random() * 10 + 2;
      const ang = (Math.random() - 0.5) * 0.4;
      ctx.strokeStyle = `rgba(160,170,200,${Math.random() * 0.04 + 0.01})`;
      ctx.lineWidth = Math.random() * 0.5 + 0.2;
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); ctx.stroke();
    }

    // decorative border
    ctx.strokeStyle = 'rgba(180,190,220,0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 6]);
    ctx.strokeRect(28, 28, W - 56, H - 56);
    ctx.setLineDash([]);

    // inner border
    ctx.strokeStyle = 'rgba(200,210,240,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(38, 38, W - 76, H - 76);

    // wax seal circle
    const cx = W / 2, cy = H / 2;
    const sealGrad = ctx.createRadialGradient(cx - 10, cy - 15, 5, cx, cy, 70);
    sealGrad.addColorStop(0,   '#ff6b6b');
    sealGrad.addColorStop(0.5, '#c0392b');
    sealGrad.addColorStop(1,   '#7b0000');
    ctx.beginPath(); ctx.arc(cx, cy, 68, 0, Math.PI * 2);
    ctx.fillStyle = sealGrad; ctx.fill();

    // seal shine
    const shine = ctx.createRadialGradient(cx - 18, cy - 22, 0, cx - 18, cy - 22, 40);
    shine.addColorStop(0, 'rgba(255,255,255,0.3)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.beginPath(); ctx.arc(cx, cy, 68, 0, Math.PI * 2); ctx.fill();

    // seal emboss ring
    ctx.strokeStyle = 'rgba(180,20,20,0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, 62, 0, Math.PI * 2); ctx.stroke();

    // lock emoji on seal
    ctx.font = 'bold 52px serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,240,240,0.95)';
    ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 8;
    ctx.fillText('🔒', cx, cy);
    ctx.shadowBlur = 0;

    // "ನಿಗೂಢ ಪತ್ರ" text top
    ctx.font = 'bold 32px "Noto Sans Kannada", serif';
    ctx.fillStyle = 'rgba(80,90,140,0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('ನಿಗೂಢ ಪತ್ರ', W / 2, H * 0.2);

    // decorative lines above/below text
    [[H * 0.26, H * 0.28], [H * 0.73, H * 0.75]].forEach(([y1, y2]) => {
      ctx.fillStyle = 'rgba(180,190,220,0.3)';
      ctx.fillRect(60, y1, W - 120, y2 - y1);
    });

    // subtle vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.8);
    vg.addColorStop(0, 'rgba(255,255,255,0)');
    vg.addColorStop(1, 'rgba(140,150,180,0.15)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

    return c;
  }

  function buildFoldGeo(segs) {
    return new THREE.PlaneGeometry(PAPER_W, PAPER_H, segs, segs);
  }

  function applyFold(geo, t) {
    const pos = geo.attributes.position;
    const origPos = geo.userData.originalPosition || pos;
    const count = pos.count;
    const hw = PAPER_W / 2, hh = PAPER_H / 2;
    for (let i = 0; i < count; i++) {
      const ox = origPos.getX(i), oy = origPos.getY(i);
      const u = (ox + hw) / PAPER_W, v = (oy + hh) / PAPER_H;
      let x = ox, y = oy, z = 0;
      const fold1 = Math.max(0, 1 - t * 1.4);
      const fold2 = Math.max(0, 1 - t * 1.1);
      const fold3 = Math.max(0, 1 - t * 0.8);
      if (v > 0.75) {
        const fv = (v - 0.75) / 0.25;
        const angle = -Math.PI * fold1 * fv;
        const pivot = hh * 0.5;
        y = pivot + (oy - hh) * Math.cos(angle);
        z = (oy - hh) * Math.sin(angle) * fold1;
      } else if (v < 0.25) {
        const fv = (0.25 - v) / 0.25;
        const angle = Math.PI * fold2 * fv;
        y = (-hh * 0.5) + (oy + hh) * Math.cos(angle);
        z = -(oy + hh) * Math.sin(angle) * fold2;
      } else {
        z = Math.sin((v - 0.5) * Math.PI * 2) * fold3 * 0.25;
      }
      const crumple = (1 - t) * 0.12;
      z += noise2(u * 8 + 1.7, v * 8 + 3.3) * crumple - crumple * 0.5;
      z += Math.sin(u * Math.PI) * fold2 * 0.2;
      pos.setXYZ(i, x, y, z);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }

  function initSinglePaper(containerEl) {
    paperContainer = containerEl;
    const W = containerEl.clientWidth || 300;
    const H = containerEl.clientHeight || 420;

    scene = new THREE.Scene(); scene.background = null;
    camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 50);
    camera.position.set(0, 0.1, 6.0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    containerEl.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const sun = new THREE.DirectionalLight(0xfff8f5, 2.0);
    sun.position.set(3, 6, 5); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.002; scene.add(sun);
    const fill = new THREE.DirectionalLight(0xc8d8ff, 0.7);
    fill.position.set(-3, -1, -3); scene.add(fill);

    const sp = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8),
      new THREE.ShadowMaterial({ opacity: 0.25, transparent: true })
    );
    sp.rotation.x = -Math.PI / 2; sp.position.y = -PAPER_H / 2 - 0.1;
    sp.receiveShadow = true; scene.add(sp); shadowPlane = sp;

    const tex = new THREE.CanvasTexture(buildSealedPaperCanvas());
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const geo = buildFoldGeo(FOLD_SEGS);
    geo.userData.originalPosition = geo.attributes.position.clone();
    const mat = new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.80, metalness: 0.0, side: THREE.DoubleSide
    });
    paperMesh = new THREE.Mesh(geo, mat);
    paperMesh.castShadow = true; paperMesh.receiveShadow = true;
    scene.add(paperMesh);

    // thin edge strips for paper thickness
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0xdce2f0, roughness: 0.9, metalness: 0 });
    const th = 0.018;
    [
      [0, -PAPER_H/2, 0,        0,         PAPER_W, th],
      [0,  PAPER_H/2, 0,        0,         PAPER_W, th],
      [-PAPER_W/2, 0, 0, Math.PI/2, PAPER_H, th],
      [ PAPER_W/2, 0, 0, Math.PI/2, PAPER_H, th],
    ].forEach(([x, y, rx, ry, sw, sh]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), edgeMat);
      m.position.set(x, y, 0); m.rotation.x = rx; m.rotation.y = ry;
      scene.add(m);
    });

    clock2 = new THREE.Clock();
  }

  function tickSinglePaper() {
    rafId = requestAnimationFrame(tickSinglePaper);
    const dt = Math.min(clock2.getDelta(), 0.05);
    phaseTime += dt;
    const geo = paperMesh.geometry;

    switch (animPhase) {
      case 'drop': {
        const ft = Math.min(phaseTime / 0.8, 1);
        const ease = 1 - Math.pow(1 - ft, 3);
        paperMesh.position.y = THREE.MathUtils.lerp(6, 0, ease);
        paperMesh.rotation.x = THREE.MathUtils.lerp(0.25, 0.04, ease);
        paperMesh.rotation.y = THREE.MathUtils.lerp(0.1, 0, ease);
        paperMesh.rotation.z = THREE.MathUtils.lerp(-0.12, 0.015, ease);
        applyFold(geo, 0.06 * ease);
        if (phaseTime > 0.8) { animPhase = 'bounce'; phaseTime = 0; } break;
      }
      case 'bounce': {
        const bAmp = Math.exp(-phaseTime * 5) * 0.3;
        paperMesh.position.y = Math.abs(Math.sin(phaseTime * 12 * Math.PI)) * bAmp;
        applyFold(geo, 0.1 + phaseTime * 0.04);
        if (phaseTime > 0.55) { animPhase = 'unfold'; phaseTime = 0; } break;
      }
      case 'unfold': {
        const ft = Math.min(phaseTime / 1.6, 1);
        const ease = ft < 0.5 ? 4*ft*ft*ft : 1 - Math.pow(-2*ft+2,3)/2;
        applyFold(geo, ease * 0.85);
        paperMesh.position.y = THREE.MathUtils.lerp(0, -0.04, ft);
        paperMesh.rotation.x = THREE.MathUtils.lerp(0.04, 0, ease);
        paperMesh.rotation.z = THREE.MathUtils.lerp(0.015, 0, ease);
        if (phaseTime > 1.6) { animPhase = 'flat'; phaseTime = 0; } break;
      }
      case 'flat': {
        const ft = Math.min(phaseTime / 0.9, 1);
        const ease = 1 - Math.pow(1 - ft, 4);
        applyFold(geo, 0.85 + ease * 0.15);
        if (phaseTime > 0.9) {
          animPhase = 'done'; phaseTime = 0;
          if (onRevealCallback) { onRevealCallback(); onRevealCallback = null; }
        } break;
      }
      case 'done': {
        const breathe = Math.sin(phaseTime * 0.8) * 0.006;
        paperMesh.rotation.x = breathe;
        paperMesh.rotation.z = Math.sin(phaseTime * 0.55) * 0.004;
        break;
      }
    }
    renderer.render(scene, camera);
  }

  function destroySinglePaper() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    window.removeEventListener('resize', onPaperResize);
    if (renderer) {
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode)
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      renderer = null;
    }
    if (paperMesh) { paperMesh.geometry.dispose(); paperMesh.material.dispose(); paperMesh = null; }
    scene = null; camera = null; shadowPlane = null;
    animPhase = 'idle'; phaseTime = 0; paperContainer = null;
  }

  function onPaperResize() {
    if (!paperContainer || !renderer || !camera) return;
    const W = paperContainer.clientWidth, H = paperContainer.clientHeight;
    camera.aspect = W / H; camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  }

  window.PaperAnimation = {
    play(containerEl, _roleData, onReveal) {
      this.destroy();
      initSinglePaper(containerEl);
      onRevealCallback = onReveal || null;
      animPhase = 'drop'; phaseTime = 0;
      paperMesh.position.set(0, 6, 0);
      paperMesh.rotation.set(0.25, 0.1, -0.12);
      applyFold(paperMesh.geometry, 0);
      window.addEventListener('resize', onPaperResize);
      tickSinglePaper();
    },
    destroy: destroySinglePaper
  };

})();
