const canvas = document.getElementById('wallpaperCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

let width, height;
let logoStars = [];
let backgroundStars = [];

window.addEventListener('resize', init);

function extractLogoPoints() {
    const logoOverlay = document.querySelector('.logo-overlay svg');
    const paths = logoOverlay.querySelectorAll('g[transform] path');
    const leafPath = paths[0];
    const bodyPath = paths[1];

    if (!leafPath || !bodyPath) return [];

    const points = [];

    [leafPath, bodyPath].forEach(path => {
        const length = path.getTotalLength();
        const samples = path === bodyPath ? 1200 : 600; // More samples

        for (let i = 0; i < samples; i++) {
            const point = path.getPointAtLength((i / samples) * length);
            points.push({ x: point.x, y: point.y });
        }
    });

    return points;
}

function svgToScreen(svgPoints) {
    const logoOverlay = document.querySelector('.logo-overlay svg');
    const rect = logoOverlay.getBoundingClientRect();
    const viewBox = logoOverlay.viewBox.baseVal;

    const scaleX = rect.width / viewBox.width;
    const scaleY = rect.height / viewBox.height;

    return svgPoints.map(p => ({
        x: rect.left + p.x * scaleX,
        y: rect.top + p.y * scaleY
    }));
}

function createLogoStar(edgePoint, distance, size, color, brightness) {
    const angle = Math.random() * Math.PI * 2;
    const dist = distance[0] + Math.random() * (distance[1] - distance[0]);

    return {
        x: edgePoint.x + Math.cos(angle) * dist,
        y: edgePoint.y + Math.sin(angle) * dist,
        size: size,
        color: color,
        brightness: brightness,
        twinkleSpeed: Math.random() * 0.002 + 0.001,
        twinklePhase: Math.random() * Math.PI * 2
    };
}

function init() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    setTimeout(() => {
        const svgPoints = extractLogoPoints();
        const screenPoints = svgToScreen(svgPoints);

        if (screenPoints.length === 0) {
            console.error('No logo points extracted');
            return;
        }

        logoStars = [];

        // MANY MORE stars but smaller and sharper - creates dense constellation
        const layers = [
            // Ultra dense core - right on the edge
            {
                count: 2500,
                distance: [0, 2],
                sizes: [3, 4, 5, 6, 7],
                colors: ['#ffffff', '#ffffff', '#ffffff', '#e8f4ff'],
                brightness: [0.85, 1.0],
                glowSize: 1.8
            },
            // Dense inner layer
            {
                count: 1500,
                distance: [2, 6],
                sizes: [2.5, 3, 4, 5],
                colors: ['#ffffff', '#ffffff', '#d4e8ff'],
                brightness: [0.75, 0.9],
                glowSize: 1.6
            },
            // Medium layer
            {
                count: 1000,
                distance: [6, 15],
                sizes: [2, 3, 4],
                colors: ['#ffffff', '#d4e8ff', '#b3d9ff'],
                brightness: [0.65, 0.8],
                glowSize: 1.5
            },
            // Outer subtle layer
            {
                count: 500,
                distance: [15, 30],
                sizes: [1.5, 2, 3],
                colors: ['#d4e8ff', '#b3d9ff', '#87ceeb'],
                brightness: [0.5, 0.7],
                glowSize: 1.4
            }
        ];

        layers.forEach(layer => {
            for (let i = 0; i < layer.count; i++) {
                const edgePoint = screenPoints[Math.floor(Math.random() * screenPoints.length)];
                const size = layer.sizes[Math.floor(Math.random() * layer.sizes.length)];
                const color = layer.colors[Math.floor(Math.random() * layer.colors.length)];
                const brightness = layer.brightness[0] + Math.random() * (layer.brightness[1] - layer.brightness[0]);

                const star = createLogoStar(edgePoint, layer.distance, size, color, brightness);
                star.glowSize = layer.glowSize;
                logoStars.push(star);
            }
        });

        console.log(`Created ${logoStars.length} logo stars`);
    }, 100);

    // Background stars
    backgroundStars = [];
    for (let i = 0; i < 800; i++) {
        backgroundStars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 1.5,
            brightness: Math.random() * 0.5,
            twinkleSpeed: Math.random() * 0.003 + 0.001,
            twinklePhase: Math.random() * Math.PI * 2
        });
    }
}

function hexToRgb(hex) {
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    return { r, g, b };
}

function drawStar(star, time) {
    const twinkle = (Math.sin(time * star.twinkleSpeed + star.twinklePhase) + 1) / 2;
    const alpha = star.brightness * (0.6 + twinkle * 0.4);
    const rgb = hexToRgb(star.color);

    // Soft glow - much smaller than before
    const glowGradient = ctx.createRadialGradient(
        star.x, star.y, 0,
        star.x, star.y, star.size * star.glowSize
    );
    glowGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.9})`);
    glowGradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.5})`);
    glowGradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size * star.glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Sharp bright core
    const coreGradient = ctx.createRadialGradient(
        star.x, star.y, 0,
        star.x, star.y, star.size * 0.8
    );
    coreGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    coreGradient.addColorStop(0.6, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.8})`);
    coreGradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size * 0.8, 0, Math.PI * 2);
    ctx.fill();
}

function animate(time) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Background stars
    backgroundStars.forEach(star => {
        const twinkle = (Math.sin(time * star.twinkleSpeed + star.twinklePhase) + 1) / 2;
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * twinkle})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Logo stars
    logoStars.forEach(star => drawStar(star, time));

    requestAnimationFrame(animate);
}

init();
requestAnimationFrame(animate);
