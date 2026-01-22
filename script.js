// Fondo animado tipo "brasas" que ascienden con brillo y sutil interacción del puntero.
(() => {
  const canvas = document.getElementById('bg');
  const ctx = canvas.getContext('2d');

  const DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  let W = 0, H = 0;

  const state = {
    particles: [],
    maxParticles: 90,
    time: 0,
    pointer: { x: null, y: null }
  };

  function resize() {
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // Adaptar cantidad de partículas al área (con límites)
    const target = Math.max(60, Math.min(150, Math.round((W * H) / 16000)));
    state.maxParticles = target;
    if (state.particles.length < target) {
      for (let i = state.particles.length; i < target; i++) state.particles.push(spawnParticle());
    } else if (state.particles.length > target) {
      state.particles.length = target;
    }
  }

  function rand(min, max) { return min + Math.random() * (max - min); }
  function choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  const hues = [
    { h: 22, s: 100, l: 60 },   // naranja
    { h: 330, s: 92, l: 62 },   // magenta
    { h: 45, s: 100, l: 58 }    // dorado
  ];

  function colorFromPalette() {
    const { h, s, l } = choice(hues);
    return `hsl(${h} ${s}% ${l}%)`;
  }

  function spawnParticle() {
    const size = rand(1.2, 3.6);
    const x = rand(0, W);
    const y = rand(H * 0.65, H + 40);
    const speed = rand(0.2, 1.1);
    const drift = rand(-0.35, 0.35);
    const life = rand(3.5, 8.5); // segundos
    return {
      x, y,
      vx: drift,
      vy: -speed,
      size,
      life,
      age: 0,
      color: colorFromPalette(),
      flicker: rand(0.85, 1.25)
    };
  }

  function update(dt) {
    state.time += dt;

    // Velado del fondo para dejar "estela" suave
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(13, 11, 22, 0.08)`; // tonos del fondo
    ctx.fillRect(0, 0, W, H);

    // Modo aditivo para el brillo de las partículas
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < state.particles.length; i++) {
      const p = state.particles[i];

      // Pequeño “ruido” determinista basado en posición/tiempo para un zigzag suave
      const swirl = Math.sin((p.y * 0.015) + (state.time * 1.2)) * 0.18;
      p.vx += swirl * 0.02;

      // Atracción ligera hacia el puntero
      if (state.pointer.x !== null && state.pointer.y !== null) {
        const dx = state.pointer.x - p.x;
        const dy = state.pointer.y - p.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < 180 * 180) {
          p.vx += (dx / Math.sqrt(dist2 + 0.0001)) * 0.03;
          p.vy += (dy / Math.sqrt(dist2 + 0.0001)) * 0.03;
        }
      }

      // Movimiento
      p.x += p.vx;
      p.y += p.vy;

      // Límite lateral con rebote suave
      if (p.x < -20) p.x = W + 20;
      if (p.x > W + 20) p.x = -20;

      // Si sale por arriba, reaparece abajo
      if (p.y < -40) {
        state.particles[i] = spawnParticle();
        continue;
      }

      p.age += dt;

      // Flicker suave del tamaño para simular brasas
      const flick = (Math.sin(state.time * p.flicker + i) * 0.4 + 1.0);
      const r = Math.max(0.8, p.size * flick);

      // Dibujo con “glow” por sombra
      ctx.save();
      ctx.shadowBlur = 12 + r * 1.4;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Envejecimiento y respawn
      if (p.age > p.life) {
        state.particles[i] = spawnParticle();
      }
    }
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000); // limitar a ~30ms
    last = now;
    update(dt);
    requestAnimationFrame(frame);
  }

  // Interacciones
  window.addEventListener('mousemove', (e) => {
    state.pointer.x = e.clientX;
    state.pointer.y = e.clientY;
  });
  window.addEventListener('mouseleave', () => {
    state.pointer.x = null;
    state.pointer.y = null;
  });

  window.addEventListener('click', (e) => {
    const burst = 16;
    for (let i = 0; i < burst; i++) {
      const p = spawnParticle();
      p.x = e.clientX + rand(-10, 10);
      p.y = e.clientY + rand(-10, 10);
      const angle = rand(-Math.PI, 0); // hacia arriba
      const speed = rand(0.8, 2.2);
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = rand(2.0, 4.2);
      p.life = rand(1.6, 3.6);
      state.particles.push(p);
    }
    // No exceder demasiado el máximo
    if (state.particles.length > state.maxParticles * 1.6) {
      state.particles.length = Math.round(state.maxParticles * 1.2);
    }
  });

  // Inicialización
  window.addEventListener('resize', resize);
  resize();
  last = performance.now();
  requestAnimationFrame(frame);
})();