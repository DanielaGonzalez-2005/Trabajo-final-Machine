/* ============================================================
   app.js – OSINT Intelligence Dashboard
   Three.js 3D Globe + Full Interactive Dashboard
============================================================ */

'use strict';

// ─── COVER / DASHBOARD TOGGLE ────────────────────────────────────────────────
function enterDashboard() {
    document.getElementById('cover-section').style.opacity = '0';
    document.getElementById('cover-section').style.transition = 'opacity 0.7s ease';
    setTimeout(() => {
        document.getElementById('cover-section').style.display = 'none';
        const root = document.getElementById('dashboard-root');
        root.classList.remove('hidden');
        root.style.opacity = '0';
        root.style.transition = 'opacity 0.5s ease';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => { root.style.opacity = '1'; });
        });
        initDashboard();
    }, 700);
}

function showCover() {
    const root = document.getElementById('dashboard-root');
    root.style.opacity = '0';
    setTimeout(() => {
        root.classList.add('hidden');
        const cover = document.getElementById('cover-section');
        cover.style.display = 'flex';
        cover.style.opacity = '0';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => { cover.style.opacity = '1'; });
        });
    }, 400);
}

// ─── COVER STAT COUNTERS ─────────────────────────────────────────────────────
(function animateCoverCounters() {
    function easeOut(t) { return 1 - Math.pow(1 - t, 4); }
    const vals = document.querySelectorAll('.cstat-val');
    const duration = 2200;
    const start = performance.now();
    function tick(now) {
        const elapsed = now - start;
        const t = Math.min(elapsed / duration, 1);
        const e = easeOut(t);
        vals.forEach(el => {
            const target = parseInt(el.dataset.target, 10);
            el.textContent = Math.round(e * target).toLocaleString();
        });
        if (t < 1) requestAnimationFrame(tick);
    }
    setTimeout(() => requestAnimationFrame(tick), 600);
})();

// ─── THREE.JS GLOBE ───────────────────────────────────────────────────────────
(function initGlobe() {
    const canvas = document.getElementById('globe-canvas');
    if (!canvas || !window.THREE) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 4.5);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x223366, 2.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0x4488ff, 4);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);
    const rimLight = new THREE.DirectionalLight(0x8844ff, 2);
    rimLight.position.set(-5, -2, -3);
    scene.add(rimLight);

    // Globe sphere
    const geo = new THREE.SphereGeometry(1.6, 64, 64);

    // Create procedural texture using canvas
    const texSize = 1024;
    const texCanvas = document.createElement('canvas');
    texCanvas.width = texSize; texCanvas.height = texSize / 2;
    const ctx = texCanvas.getContext('2d');

    // Deep ocean base
    ctx.fillStyle = '#061630';
    ctx.fillRect(0, 0, texSize, texSize / 2);

    // Draw grid lines (lat/lon)
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.18)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 18; i++) {
        const y = (i / 18) * (texSize / 2);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(texSize, y); ctx.stroke();
    }
    for (let i = 0; i <= 36; i++) {
        const x = (i / 36) * texSize;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, texSize / 2); ctx.stroke();
    }

    // Scatter random land-like patches
    ctx.fillStyle = 'rgba(10, 40, 90, 0.7)';
    const patches = [
        [260, 60, 120, 60], [200, 30, 60, 40], [350, 40, 80, 50],
        [480, 55, 60, 45], [600, 70, 100, 50], [700, 40, 60, 35],
        [120, 130, 80, 40], [300, 150, 100, 50], [500, 140, 90, 45],
        [150, 80, 50, 30], [800, 100, 60, 40], [900, 60, 80, 50],
        [50, 50, 40, 30], [980, 80, 40, 30],
    ];
    patches.forEach(([x, y, w, h]) => {
        ctx.beginPath();
        ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
        ctx.fill();
    });

    // Glow hotspots for Iran and Israel region (Middle East)
    const gradient = ctx.createRadialGradient(500, 65, 0, 500, 65, 50);
    gradient.addColorStop(0, 'rgba(239,68,68,0.5)');
    gradient.addColorStop(1, 'rgba(239,68,68,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, texSize, texSize / 2);

    const texture = new THREE.CanvasTexture(texCanvas);
    const mat = new THREE.MeshPhongMaterial({
        map: texture,
        emissive: new THREE.Color(0x0a1a40),
        emissiveIntensity: 0.8,
        specular: new THREE.Color(0x4488ff),
        shininess: 35,
        transparent: true,
        opacity: 0.92,
    });
    const globe = new THREE.Mesh(geo, mat);
    scene.add(globe);

    // Atmosphere glow
    const atmosGeo = new THREE.SphereGeometry(1.65, 64, 64);
    const atmosMat = new THREE.MeshPhongMaterial({
        color: 0x1a3a8f,
        transparent: true,
        opacity: 0.22,
        side: THREE.FrontSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const atmos = new THREE.Mesh(atmosGeo, atmosMat);
    scene.add(atmos);

    // Outer glow ring
    const outerGeo = new THREE.SphereGeometry(1.75, 64, 64);
    const outerMat = new THREE.MeshPhongMaterial({
        color: 0x0044cc,
        transparent: true,
        opacity: 0.08,
        side: THREE.FrontSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    scene.add(new THREE.Mesh(outerGeo, outerMat));

    // Country markers (lat/lon → 3D)
    function latLonToVec3(lat, lon, r) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        return new THREE.Vector3(
            -r * Math.sin(phi) * Math.cos(theta),
             r * Math.cos(phi),
             r * Math.sin(phi) * Math.sin(theta)
        );
    }

    const markers = [
        { lat: 31.5, lon: 34.75,  color: 0xef4444, label: 'label-israel', name: 'Israel'  },
        { lat: 32.4, lon: 53.7,   color: 0xf97316, label: 'label-iran',   name: 'Irán'    },
        { lat: 37.1, lon: -95.7,  color: 0x3b82f6, label: 'label-usa',    name: 'EE.UU.'  },
    ];

    const markerGroup = new THREE.Group();
    scene.add(markerGroup);

    markers.forEach(m => {
        const pos = latLonToVec3(m.lat, m.lon, 1.62);
        // Inner dot
        const dotGeo = new THREE.SphereGeometry(0.035, 12, 12);
        const dotMat = new THREE.MeshPhongMaterial({ color: m.color, emissive: m.color, emissiveIntensity: 2 });
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.copy(pos);
        markerGroup.add(dot);

        // Pulse ring
        const ringGeo = new THREE.RingGeometry(0.05, 0.075, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: m.color, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(pos);
        ring.lookAt(new THREE.Vector3(0, 0, 0));
        ring.userData = { pulse: true, baseScale: 1, phaseOffset: Math.random() * Math.PI * 2 };
        markerGroup.add(ring);
    });

    // Star field background
    const starGeo = new THREE.BufferGeometry();
    const starPositions = [];
    for (let i = 0; i < 1800; i++) {
        starPositions.push(
            (Math.random() - 0.5) * 300,
            (Math.random() - 0.5) * 300,
            (Math.random() - 0.5) * 300
        );
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.65 });
    scene.add(new THREE.Points(starGeo, starMat));

    // Orbital ring
    const orbitGeo = new THREE.TorusGeometry(2.2, 0.008, 8, 128);
    const orbitMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.35 });
    const orbit = new THREE.Mesh(orbitGeo, orbitMat);
    orbit.rotation.x = Math.PI / 5;
    scene.add(orbit);

    // Satellite dot on orbit
    const satGeo = new THREE.SphereGeometry(0.028, 8, 8);
    const satMat = new THREE.MeshPhongMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 3 });
    const satellite = new THREE.Mesh(satGeo, satMat);
    scene.add(satellite);

    let satAngle = 0;
    const orbitRadius = 2.2;
    const orbitTiltX = Math.PI / 5;

    function animate(time) {
        requestAnimationFrame(animate);

        globe.rotation.y += 0.0018;
        markerGroup.rotation.y += 0.0018;

        // Pulse rings
        markerGroup.children.forEach(child => {
            if (child.userData.pulse) {
                const s = 1 + 0.5 * Math.abs(Math.sin(time * 0.002 + (child.userData.phaseOffset || 0)));
                child.scale.setScalar(s);
                child.material.opacity = 0.7 - 0.5 * Math.abs(Math.sin(time * 0.002 + (child.userData.phaseOffset || 0)));
            }
        });

        // Satellite orbit
        satAngle += 0.009;
        satellite.position.x = orbitRadius * Math.cos(satAngle);
        satellite.position.y = orbitRadius * Math.sin(satAngle) * Math.sin(orbitTiltX);
        satellite.position.z = orbitRadius * Math.sin(satAngle) * Math.cos(orbitTiltX);

        renderer.render(scene, camera);
    }
    animate(0);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
})();

// ─── CLOCK ────────────────────────────────────────────────────────────────────
function updateClock() {
    const el = document.getElementById('live-clock');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toUTCString().slice(17, 25) + ' UTC';
}
setInterval(updateClock, 1000);
updateClock();

// ─── SYNTHETIC DATA ENGINE ───────────────────────────────────────────────────
const DATA = (() => {
    const countries = ['Israel', 'Iran', 'United States'];
    const startDate = new Date('2024-01-01');
    const endDate   = new Date('2026-05-13');
    const days = Math.ceil((endDate - startDate) / 86400000);

    const records = {};
    countries.forEach(country => {
        const rows = [];
        let brent = 79.5;
        let tone  = -1.2;
        let events = country === 'United States' ? 2 : 18;

        for (let d = 0; d < days; d++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + d);

            brent  = Math.max(50, Math.min(130, brent  + (Math.random() - 0.48) * 1.8));
            tone   = Math.max(-8, Math.min(2, tone + (Math.random() - 0.5) * 0.8));
            events = Math.max(0, Math.min(country === 'United States' ? 12 : 60, events + (Math.random() - 0.45) * 4));

            const fatalities = country === 'United States' ? 0 : Math.floor(Math.random() * Math.random() * 18);
            const emb_score  = Math.min(1, Math.max(0, 0.3 + Math.random() * 0.7 - 0.3));

            // Ground truth label
            const score = events * 0.04 + fatalities * 0.06 + emb_score * 0.4 + (-tone) * 0.04;
            let label = 0;
            if (score > 0.65) label = 2;
            else if (score > 0.32) label = 1;

            rows.push({
                date: date.toISOString().slice(0, 10),
                events: Math.round(events),
                fatalities,
                tone: parseFloat(tone.toFixed(2)),
                brent: parseFloat(brent.toFixed(2)),
                emb_score: parseFloat(emb_score.toFixed(3)),
                label,
            });
        }
        records[country] = rows;
    });
    return records;
})();

// ─── ML CLASSIFIER (Logistic Regression weights, Scenario B) ─────────────────
const COEFFICIENTS = {
    intercepts: [-0.38, 0.12, 0.26],
    features: ['events', 'fatalities', 'brent', 'emb_score', 'neg_tone'],
    weights: [
        [ 0.82,  1.15, -0.12,  1.44, -0.35],
        [ 0.38,  0.22,  0.08,  0.52,  0.18],
        [-0.65, -0.74,  0.11, -1.22,  0.46],
    ],
    means:  [16.2, 4.1,  82.4, 0.47, 1.8],
    stds:   [12.5, 7.3,  14.1, 0.23, 2.1],
};

function softmax(logits) {
    const maxL = Math.max(...logits);
    const exps = logits.map(v => Math.exp(v - maxL));
    const sum  = exps.reduce((a, b) => a + b, 0);
    return exps.map(v => v / sum);
}

function predict(row) {
    const feat = [
        row.events,
        row.fatalities,
        row.brent,
        row.emb_score,
        -row.tone,
    ];
    const scaled = feat.map((v, i) => (v - COEFFICIENTS.means[i]) / COEFFICIENTS.stds[i]);
    const logits = COEFFICIENTS.weights.map((w, c) =>
        COEFFICIENTS.intercepts[c] + w.reduce((s, wi, i) => s + wi * scaled[i], 0)
    );
    return softmax(logits);
}

// ─── STATE ────────────────────────────────────────────────────────────────────
let state = {
    country: 'Israel',
    dateIndex: 0,
    chart: null,
    sparkCharts: {},
    gaugeCtx: null,
    map: null,
    currentChartMode: 'brent',
};

// ─── DASHBOARD INIT ───────────────────────────────────────────────────────────
function initDashboard() {
    if (state._initialized) return;
    state._initialized = true;

    initMap();
    initMainChart();
    initSparklines();
    initGaugeCanvas();
    renderNewsFeed();

    const slider = document.getElementById('date-slider');
    slider.addEventListener('input', () => {
        const pct = parseInt(slider.value, 10) / 100;
        const rows = DATA[state.country];
        state.dateIndex = Math.floor(pct * (rows.length - 1));
        updateAll();
    });

    document.getElementById('country-selector').addEventListener('change', e => {
        state.country = e.target.value;
        const rows = DATA[state.country];
        state.dateIndex = Math.floor(parseInt(document.getElementById('date-slider').value, 10) / 100 * (rows.length - 1));
        updateAll();
        renderMiniTimeline();
    });

    updateAll();
    renderMiniTimeline();
    setInterval(tickLive, 4000);
}

// ─── UPDATE ALL ───────────────────────────────────────────────────────────────
function updateAll() {
    const rows = DATA[state.country];
    const row  = rows[state.dateIndex];

    document.getElementById('current-date-text').textContent = row.date;

    // Telemetry
    animateNumber('val-events', row.events, 0);
    animateNumber('val-fatalities', row.fatalities, 0);
    document.getElementById('val-tone').textContent = row.tone.toFixed(2);
    document.getElementById('val-brent').textContent = '$' + row.brent.toFixed(2);

    // ML Prediction
    const probs = predict(row);
    const pred  = probs.indexOf(Math.max(...probs));
    const labels = ['Baja Escalada (Calma)', 'Media Escalada (Tensión)', 'Alta Escalada (Ataque)'];
    const labelColors = ['#10b981', '#f97316', '#ef4444'];

    const predText = document.getElementById('predicted-class-text');
    predText.textContent = labels[pred];
    predText.style.color = labelColors[pred];

    const badge = document.getElementById('prediction-badge');
    badge.style.borderColor = labelColors[pred] + '50';
    badge.style.background  = labelColors[pred] + '18';

    ['0','1','2'].forEach(i => {
        const pct = Math.round(probs[i] * 100);
        document.getElementById(`prob-${i}-text`).textContent = pct + '%';
        document.getElementById(`prob-${i}-fill`).style.width = pct + '%';
    });

    // Threat Gauge
    drawGauge(probs[2] * 0.5 + probs[1] * 0.25 + probs[0] * 0.0);

    // XAI
    renderXAI(row, probs);

    // Sparklines
    updateSparklines(rows, state.dateIndex);

    // Main chart (last 90 days up to current)
    updateMainChart(rows, state.dateIndex);
}

// ─── ANIMATED NUMBER ─────────────────────────────────────────────────────────
function animateNumber(id, target, decimals) {
    const el = document.getElementById(id);
    if (!el) return;
    const current = parseFloat(el.textContent.replace(/[^0-9.-]/g, '')) || 0;
    const diff = target - current;
    const steps = 18;
    let step = 0;
    function tick() {
        step++;
        const v = current + diff * (step / steps);
        el.textContent = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString();
        if (step < steps) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

// ─── THREAT GAUGE (arc canvas) ────────────────────────────────────────────────
function initGaugeCanvas() {
    state.gaugeCtx = document.getElementById('gauge-canvas').getContext('2d');
}

function drawGauge(ratio) {
    const ctx = state.gaugeCtx;
    if (!ctx) return;
    const W = 220, H = 130;
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2, cy = H - 10;
    const r  = 90;
    const startAngle = Math.PI;
    const endAngle   = 2 * Math.PI;

    // Track
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.lineWidth = 14;
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Color sectors
    const sectors = [
        { from: 0,    to: 0.33, color: '#10b981' },
        { from: 0.33, to: 0.66, color: '#f97316' },
        { from: 0.66, to: 1.00, color: '#ef4444' },
    ];
    sectors.forEach(s => {
        ctx.beginPath();
        ctx.arc(cx, cy, r,
            startAngle + s.from * Math.PI,
            startAngle + s.to   * Math.PI);
        ctx.lineWidth = 14;
        ctx.strokeStyle = s.color;
        ctx.globalAlpha = 0.35;
        ctx.stroke();
        ctx.globalAlpha = 1;
    });

    // Needle arc (filled portion)
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, startAngle + ratio * Math.PI);
    const grad = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
    grad.addColorStop(0,   '#10b981');
    grad.addColorStop(0.5, '#f97316');
    grad.addColorStop(1,   '#ef4444');
    ctx.lineWidth = 14;
    ctx.strokeStyle = grad;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Needle pointer
    const angle = startAngle + ratio * Math.PI;
    const nx = cx + (r - 14) * Math.cos(angle);
    const ny = cy + (r - 14) * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(nx, ny);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'white';
    ctx.shadowColor = 'white';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();

    // Labels
    const pct = Math.round(ratio * 100);
    const threatLabel = pct < 33 ? 'Calma' : pct < 66 ? 'Alerta' : 'Crítico';
    const threatColor = pct < 33 ? '#10b981' : pct < 66 ? '#f97316' : '#ef4444';

    document.getElementById('gauge-label').textContent = threatLabel;
    document.getElementById('gauge-label').style.color = threatColor;
    document.getElementById('gauge-percent').textContent = pct + '%';
    document.getElementById('gauge-percent').style.color = threatColor;
}

// ─── XAI DRIVERS ─────────────────────────────────────────────────────────────
function renderXAI(row, probs) {
    const pred = probs.indexOf(Math.max(...probs));
    const w = COEFFICIENTS.weights[pred];
    const feat = [row.events, row.fatalities, row.brent, row.emb_score, -row.tone];
    const names = ['eventos_acled', 'bajas_acled', 'precio_brent', 'score_emb_alta', 'neg_tono_gdelt'];

    const contributions = w.map((wi, i) => ({
        name: names[i],
        value: wi * ((feat[i] - COEFFICIENTS.means[i]) / COEFFICIENTS.stds[i]),
    })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    const container = document.getElementById('xai-drivers-container');
    const maxVal = Math.max(...contributions.map(c => Math.abs(c.value)), 0.01);

    container.innerHTML = contributions.map(c => {
        const isPos = c.value >= 0;
        const pct   = Math.abs(c.value) / maxVal * 100;
        const coefStr = (c.value >= 0 ? '+' : '') + c.value.toFixed(3);
        return `<div class="xai-driver-row">
            <span class="xai-feature-name">${c.name}</span>
            <div class="xai-bar-track">
                <div class="xai-bar-fill ${isPos ? 'pos' : 'neg'}" style="width:${pct.toFixed(1)}%"></div>
            </div>
            <span class="xai-coef" style="color:${isPos ? 'var(--accent-cyan)' : 'var(--accent-red)'}">${coefStr}</span>
        </div>`;
    }).join('');
}

// ─── MINI TIMELINE SIMULATION ────────────────────────────────────────────────
function renderMiniTimeline() {
    const rows = DATA[state.country];
    const container = document.getElementById('mini-timeline');
    const last30 = rows.slice(Math.max(0, rows.length - 30));
    const maxH = 60;
    const maxE = Math.max(...last30.map(r => r.events), 1);

    container.innerHTML = last30.map((r, i) => {
        const h = Math.max(6, Math.round((r.events / maxE) * maxH));
        const cls = r.label === 0 ? 'low' : r.label === 1 ? 'medium' : 'high';
        return `<div class="mini-bar ${cls}" style="height:${h}px" data-tip="${r.date}: Clase ${r.label} | ${r.events} eventos"></div>`;
    }).join('');
}

// ─── LIVE TICK SIMULATION (random updates every 4s) ──────────────────────────
function tickLive() {
    const rows = DATA[state.country];
    const i = state.dateIndex;
    if (i >= rows.length) return;
    // Tiny noise to simulate "live" streaming
    const row = { ...rows[i] };
    row.events      = Math.max(0, row.events      + Math.round((Math.random() - 0.5) * 2));
    row.fatalities  = Math.max(0, row.fatalities  + Math.round((Math.random() - 0.5)));
    row.tone        = parseFloat((row.tone + (Math.random() - 0.5) * 0.2).toFixed(2));
    row.brent       = parseFloat((row.brent + (Math.random() - 0.5) * 0.6).toFixed(2));
    row.emb_score   = Math.min(1, Math.max(0, row.emb_score + (Math.random() - 0.5) * 0.05));

    document.getElementById('val-events').textContent     = row.events.toLocaleString();
    document.getElementById('val-fatalities').textContent = row.fatalities.toLocaleString();
    document.getElementById('val-tone').textContent       = row.tone.toFixed(2);
    document.getElementById('val-brent').textContent      = '$' + row.brent.toFixed(2);

    const probs = predict(row);
    const ratio = probs[2] * 0.5 + probs[1] * 0.25;
    drawGauge(ratio);
}

// ─── SPARKLINES ──────────────────────────────────────────────────────────────
function initSparklines() {
    const sparkCfg = (color) => ({
        type: 'line',
        data: { labels: Array(30).fill(''), datasets: [{ data: Array(30).fill(0), borderColor: color, borderWidth: 2, fill: true, backgroundColor: color + '22', tension: 0.4, pointRadius: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } },
    });
    state.sparkCharts.events     = new Chart(document.getElementById('spark-events'),     sparkCfg('#ef4444'));
    state.sparkCharts.fatalities = new Chart(document.getElementById('spark-fatalities'), sparkCfg('#f97316'));
    state.sparkCharts.tone       = new Chart(document.getElementById('spark-tone'),       sparkCfg('#3b82f6'));
    state.sparkCharts.brent      = new Chart(document.getElementById('spark-brent'),      sparkCfg('#10b981'));
}

function updateSparklines(rows, idx) {
    const window30 = rows.slice(Math.max(0, idx - 29), idx + 1);
    const set = (key, dataArr) => {
        const sc = state.sparkCharts[key];
        if (!sc) return;
        sc.data.datasets[0].data = dataArr;
        sc.update('none');
    };
    set('events',     window30.map(r => r.events));
    set('fatalities', window30.map(r => r.fatalities));
    set('tone',       window30.map(r => r.tone));
    set('brent',      window30.map(r => r.brent));
}

// ─── MAIN CHART ──────────────────────────────────────────────────────────────
function initMainChart() {
    const ctx = document.getElementById('main-chart').getContext('2d');
    state.chart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            animation: { duration: 400 },
            plugins: {
                legend: {
                    labels: { color: '#94a3b8', font: { family: 'Outfit', size: 11 }, boxWidth: 14, padding: 16 }
                },
                tooltip: {
                    backgroundColor: 'rgba(5,10,30,0.9)',
                    borderColor: 'rgba(59,130,246,0.35)',
                    borderWidth: 1,
                    titleColor: 'white',
                    bodyColor: '#94a3b8',
                    padding: 12,
                }
            },
            scales: {
                x: { ticks: { color: '#4b5a6e', maxTicksLimit: 8, font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                y: { ticks: { color: '#4b5a6e', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                y1: { display: false },
            },
        },
    });
}

function updateMainChart(rows, idx) {
    const slice = rows.slice(Math.max(0, idx - 89), idx + 1);
    const labels = slice.map(r => r.date.slice(5));

    let datasets = [];
    if (state.currentChartMode === 'brent') {
        datasets = [
            { label: 'Brent (USD)', data: slice.map(r => r.brent), borderColor: '#10b981', backgroundColor: '#10b98118', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2, yAxisID: 'y' },
            { label: 'Clase Escalada', data: slice.map(r => r.label), borderColor: '#f97316', backgroundColor: '#f9731618', fill: true, tension: 0, pointRadius: 0, borderWidth: 2, stepped: true, yAxisID: 'y1' },
        ];
        state.chart.options.scales.y1.display = true;
        state.chart.options.scales.y1.min = -0.2;
        state.chart.options.scales.y1.max = 2.5;
        state.chart.options.scales.y1.position = 'right';
        state.chart.options.scales.y1.ticks = { color: '#4b5a6e', stepSize: 1, font: { size: 10 } };
        state.chart.options.scales.y1.grid = { display: false };
    } else if (state.currentChartMode === 'nlp') {
        datasets = [
            { label: 'Score Embeddings Alta', data: slice.map(r => r.emb_score), borderColor: '#8b5cf6', backgroundColor: '#8b5cf618', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2, yAxisID: 'y' },
            { label: 'Tono GDELT', data: slice.map(r => r.tone), borderColor: '#06b6d4', backgroundColor: '#06b6d418', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2, yAxisID: 'y' },
        ];
        state.chart.options.scales.y1.display = false;
    } else {
        datasets = [
            { label: 'Eventos Físicos', data: slice.map(r => r.events), borderColor: '#ef4444', backgroundColor: '#ef444418', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2, yAxisID: 'y' },
            { label: 'Bajas', data: slice.map(r => r.fatalities), borderColor: '#f97316', backgroundColor: '#f9731618', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2, yAxisID: 'y' },
        ];
        state.chart.options.scales.y1.display = false;
    }

    state.chart.data.labels   = labels;
    state.chart.data.datasets = datasets;
    state.chart.update('none');
}

function switchChart(mode) {
    state.currentChartMode = mode;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    const rows = DATA[state.country];
    updateMainChart(rows, state.dateIndex);
}

// ─── LEAFLET MAP ─────────────────────────────────────────────────────────────
function initMap() {
    if (state.map) return;
    state.map = L.map('tactical-map', {
        center: [28, 45],
        zoom: 4,
        zoomControl: true,
        attributionControl: false,
    });

    // Dark tactical tile
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 18,
    }).addTo(state.map);

    const countryData = [
        { name: 'Israel',         lat: 31.05, lon: 34.85, flag: '🇮🇱', color: '#ef4444', risk: 'ALTO',  events: 1842, brent_delta: '+8.4%' },
        { name: 'Irán',           lat: 32.43, lon: 53.69, flag: '🇮🇷', color: '#f97316', risk: 'ALTO',  events: 958,  brent_delta: '+6.1%' },
        { name: 'Estados Unidos', lat: 37.09, lon: -95.71,flag: '🇺🇸', color: '#3b82f6', risk: 'MEDIO', events: 134,  brent_delta: '+2.9%' },
    ];

    countryData.forEach(c => {
        // Custom pulsing marker
        const pulseIcon = L.divIcon({
            className: '',
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            html: `<div style="
                position:relative;width:14px;height:14px;border-radius:50%;
                background:${c.color};
                box-shadow:0 0 16px ${c.color}, 0 0 30px ${c.color}55;
                border:2px solid white;
                animation:pulse-pin 1.5s ease-in-out infinite;
                "></div>
                <style>@keyframes pulse-pin{0%,100%{transform:scale(1);}50%{transform:scale(1.4);}}</style>`,
        });

        const marker = L.marker([c.lat, c.lon], { icon: pulseIcon }).addTo(state.map);

        // Rings
        [60000, 130000, 220000].forEach((r, i) => {
            L.circle([c.lat, c.lon], {
                radius: r,
                color: c.color,
                weight: 0.8,
                opacity: 0.25 - i * 0.06,
                fill: false,
                dashArray: i === 0 ? null : '4 6',
            }).addTo(state.map);
        });

        marker.bindPopup(`
            <div style="font-family:'Outfit',sans-serif;padding:8px;min-width:180px;">
                <div style="font-size:1.4rem;margin-bottom:6px;">${c.flag} <strong>${c.name}</strong></div>
                <div style="font-size:0.78rem;color:#94a3b8;margin-bottom:8px;">Actor geopolítico clave</div>
                <table style="width:100%;font-size:0.78rem;">
                    <tr><td style="color:#94a3b8;">Nivel de Riesgo</td><td><strong style="color:${c.color}">${c.risk}</strong></td></tr>
                    <tr><td style="color:#94a3b8;">Eventos ACLED</td><td><strong>${c.events}</strong></td></tr>
                    <tr><td style="color:#94a3b8;">Impacto Brent</td><td><strong>${c.brent_delta}</strong></td></tr>
                </table>
            </div>
        `, { className: 'country-popup' });
    });

    // Draw tension arc between Israel and Iran
    const latlngs = [
        [31.05, 34.85],
        [31.74, 45.0],
        [32.43, 53.69],
    ];
    L.polyline(latlngs, {
        color: '#ef4444',
        weight: 2,
        opacity: 0.55,
        dashArray: '6 8',
    }).addTo(state.map);
}

// ─── NEWS FEED ────────────────────────────────────────────────────────────────
function renderNewsFeed() {
    const feeds = [
        { title: 'Cohetes interceptados sobre Tel Aviv al amanecer',  date: '2026-05-13', risk: 'high',   icon: '🚨', source: 'GDELT · Reuters' },
        { title: 'Brent sube 3.2% tras ataque a infraestructura en Natanz', date: '2026-05-12', risk: 'high',   icon: '🛢️', source: 'GDELT · Bloomberg' },
        { title: 'EE.UU. refuerza flotilla en el Golfo Pérsico',       date: '2026-05-11', risk: 'medium', icon: '⚓', source: 'GDELT · AP' },
        { title: 'Negociaciones en Qatar generan tregua frágil',       date: '2026-05-10', risk: 'low',    icon: '🕊️', source: 'GDELT · Al Jazeera' },
        { title: 'Drones atacan refinería en el sur de Israel',        date: '2026-05-09', risk: 'high',   icon: '💥', source: 'GDELT · NYT' },
        { title: 'Sanción de EE.UU. a exportaciones iraníes de petróleo', date: '2026-05-08', risk: 'medium', icon: '📋', source: 'GDELT · CNN' },
    ];

    document.getElementById('news-feed-container').innerHTML = feeds.map(f => `
        <div class="news-item ${f.risk}-risk">
            <span class="news-icon">${f.icon}</span>
            <div class="news-body">
                <span class="news-title">${f.title}</span>
                <span class="news-meta">${f.source} · ${f.date}</span>
            </div>
        </div>
    `).join('');

    document.getElementById('feed-status-text').textContent = `${feeds.length} fuentes activas`;
}
