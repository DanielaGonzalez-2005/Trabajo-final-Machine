// Global state variables
let dataset = [];
let modelParams = {};
let uniqueDates = [];
let currentCountry = 'Israel';
let currentDate = '';
let currentChartType = 'brent';
let mainChart = null;

// Leaflet Map variables
let map = null;
let markers = {};
let radarCircles = {};

// Geographic coordinates mapping
const coordinates = {
    'Israel': { lat: 31.2, lng: 34.8, zoom: 7 },
    'Iran': { lat: 32.4, lng: 53.6, zoom: 5 },
    'United States': { lat: 26.5, lng: 56.2, zoom: 6 } // Center on Strait of Hormuz representing US presence
};

// Feature translation for XAI readability
const featureTranslations = {
    'n_eventos': 'Total de Eventos Físicos',
    'n_batallas': 'Batallas Directas',
    'n_explosiones': 'Ataques/Explosiones',
    'n_protestas': 'Protestas y Disturbios',
    'total_bajas': 'Bajas Mortales',
    'pob_afectada_1km': 'Población Expuesta (1km)',
    'n_articulos_2026': 'Artículos Registrados GDELT',
    'n_fuentes_2026': 'Fuentes Informativas GDELT',
    'precio_brent': 'Precio Petróleo Brent',
    'brent_variacion': 'Retorno Diario Brent',
    'brent_7d': 'Retorno Brent 7 Días',
    'tono_gdelt_3d': 'Tono GDELT (3 días)',
    'tono_gdelt_7d': 'Tono GDELT (7 días)',
    'tono_gdelt_cambio': 'Variación de Tono GDELT',
    'total_bajas_acum5d': 'Bajas Acumuladas (5 días)',
    'total_bajas_cambio': 'Aceleración de Bajas',
    'n_eventos_3d': 'Eventos Físicos (3 días)',
    'n_eventos_cambio': 'Cambio en Frecuencia de Eventos',
    'n_explosiones_acum5d': 'Explosiones Acumuladas (5 días)',
    'sentimiento_medio_3d': 'Intensidad Sentimiento (3 días)',
    'sentimiento_medio_7d': 'Intensidad Sentimiento (7 días)',
    'precio_brent_cambio': 'Cambio de Precio Brent',
    'brent_variacion_3d': 'Retorno Brent (3 días)',
    'n_articulos_2026_3d': 'Artículos GDELT (3 días)',
    'n_articulos_2026_cambio': 'Cambio en Volumen de Artículos',
    'pct_alta_emb': 'Noticias Alta Escalada (%)',
    'pct_media_emb': 'Noticias Media Escalada (%)',
    'pct_baja_emb': 'Noticias Baja Escalada (%)',
    'score_alta_prom': 'Similitud Semántica Alta',
    'score_media_prom': 'Similitud Semántica Media',
    'score_baja_prom': 'Similitud Semántica Baja',
    'confianza_prom': 'Confianza Clasificación NLP',
    'n_titulares': 'Titulares NLP Procesados',
    'pais_Iran': 'Indicator Irán',
    'pais_Israel': 'Indicator Israel',
    'pais_United States': 'Indicator EE.UU.'
};

// Mock headlines template for GDELT feed based on Country & Escalation Class
const headlinesTemplate = {
    'Israel': {
        2: [
            "Heavy airstrikes reported near Damascus targeting weapons depots",
            "Rocket warning sirens activated in Tel Aviv and central districts",
            "IDF confirms interception of hostile UAVs launched from the east",
            "Emergency cabinet meeting convened following escalation of borders"
        ],
        1: [
            "Security forces placed on high alert amid intelligence warnings",
            "Diplomatic pressure mounts as border skirmishes continue",
            "Protests erupt in Jerusalem demanding rapid security resolutions",
            "Naval vessels patrol maritime borders in Mediterranean sea"
        ],
        0: [
            "De-escalation talks show progress regarding humanitarian corridors",
            "Borders remain quiet as ceasefire negotiations hold steady",
            "Central districts return to normal routing following calm week",
            "Joint naval exercises completed without incident"
        ]
    },
    'Iran': {
        2: [
            "Iran state television reports missile test launches in central desert",
            "Air defenses activated over Isfahan following drone detections",
            "Tehran warns of direct retaliation against strategic sites",
            "Strait of Hormuz naval patrols increased under combat protocols"
        ],
        1: [
            "Military officials hold exercises in southern coast regions",
            "Tehran warns regional neighbors against hosting hostile bases",
            "Ambassadors recalled from European capitals amid sanctions dispute",
            "Security protocols tightened around nuclear facilities"
        ],
        0: [
            "Iran expresses willingness to resume JCPOA negotiations in Vienna",
            "Commercial ships traverse Strait of Hormuz without delays",
            "Foreign ministry welcomes dialogue with regional mediators",
            "Partial lifting of cargo restrictions announced"
        ]
    },
    'United States': {
        2: [
            "US Navy carrier strike group deploys to Eastern Mediterranean",
            "Pentagon confirms airstrikes against military assets in Persian Gulf",
            "State Department issues emergency evacuation warnings for embassy staff",
            "White House announces emergency security briefings with allies"
        ],
        1: [
            "US warships monitor movements in Strait of Hormuz actively",
            "Joint statements warn regional actors against hostile initiatives",
            "Envoys travel to Middle East to de-escalate tensions",
            "Security patrols coordinated with regional coalition partners"
        ],
        0: [
            "US delegation meets in Qatar for indirect peace talks",
            "Joint military exercises shift focus to defensive logistics",
            "Bilateral agreements reached for maritime safe lanes",
            "Trade delegations finalize energy supply routing protocols"
        ]
    }
};

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadDataAndModel();
    setupEventListeners();
});

// Initialize Leaflet Tactical Map
function initMap() {
    map = L.map('tactical-map', {
        zoomControl: true,
        attributionControl: false
    }).setView([29.0, 48.0], 4); // Centered in Middle East

    // CartoDB Dark Matter tiles (Perfect for cybersecurity HUD look)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18
    }).addTo(map);

    // Initialize markers and radar rings for each country
    Object.keys(coordinates).forEach(country => {
        const coords = coordinates[country];
        
        // Custom simple div icon for tactical marker
        const icon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class='status-dot' style='background-color:#38bdf8;box-shadow: 0 0 10px #38bdf8;'></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });

        markers[country] = L.marker([coords.lat, coords.lng], { icon: icon }).addTo(map);
        markers[country].bindPopup(`<b>${country}</b><br>Monitoreo OSINT activo.`);

        // Dynamic pulsing radar ring overlay (using L.circle)
        radarCircles[country] = L.circle([coords.lat, coords.lng], {
            radius: 50000, // meters
            color: '#38bdf8',
            fillColor: '#38bdf8',
            fillOpacity: 0.1,
            weight: 2
        }).addTo(map);
    });
}

// Load resources via HTTP requests
async function loadDataAndModel() {
    try {
        const modelResponse = await fetch('model_coefficients.json');
        modelParams = await modelResponse.json();
        console.log("Model parameters loaded:", modelParams.features.length, "features");

        const csvResponse = await fetch('dataset_final_con_embeddings.csv');
        const csvText = await csvResponse.text();
        
        Papa.parse(csvText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: function(results) {
                dataset = results.data;
                console.log("Dataset parsed:", dataset.length, "rows");
                initializeSelectors();
            }
        });
    } catch (error) {
        console.error("Error loading resources:", error);
        document.getElementById('predicted-class-text').innerText = "Error cargando recursos";
    }
}

// Setup Event Handlers
function setupEventListeners() {
    const countrySelector = document.getElementById('country-selector');
    const dateSlider = document.getElementById('date-slider');

    countrySelector.addEventListener('change', (e) => {
        currentCountry = e.target.value;
        // Map updates
        const coords = coordinates[currentCountry];
        map.setView([coords.lat, coords.lng], coords.zoom);
        onCountryChange();
    });

    dateSlider.addEventListener('input', (e) => {
        const index = parseInt(e.target.value);
        if (uniqueDates[index]) {
            currentDate = uniqueDates[index];
            updateSelection();
        }
    });
}

// Populate selectors and parameters on load
function initializeSelectors() {
    onCountryChange();
    // Default map zoom to Israel
    const coords = coordinates['Israel'];
    map.setView([coords.lat, coords.lng], coords.zoom);
}

// Handle country dropdown modifications
function onCountryChange() {
    const countryRows = dataset.filter(row => row.pais === currentCountry);
    countryRows.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    uniqueDates = countryRows.map(row => row.fecha);
    
    const dateSlider = document.getElementById('date-slider');
    dateSlider.min = 0;
    dateSlider.max = uniqueDates.length - 1;
    
    // Start at latest date (latest update of GDELT/ACLED)
    let startIndex = uniqueDates.length - 1;
    dateSlider.value = startIndex;
    currentDate = uniqueDates[startIndex];
    
    document.getElementById('date-start-label').innerText = uniqueDates[0];
    document.getElementById('date-end-label').innerText = uniqueDates[uniqueDates.length - 1];

    updateSelection();
}

// Update UI elements based on current selection
function updateSelection() {
    document.getElementById('current-date-text').innerText = currentDate;
    
    const selectedRow = dataset.find(row => row.pais === currentCountry && row.fecha === currentDate);
    
    if (selectedRow) {
        runInference(selectedRow);
        updateTelemetry(selectedRow);
        updateCharts();
    } else {
        console.warn(`Row not found for country: ${currentCountry}, date: ${currentDate}`);
    }
}

// Update telemetry metrics displayed in cards
function updateTelemetry(row) {
    document.getElementById('val-events').innerText = row.n_eventos !== undefined ? Math.round(row.n_eventos) : 0;
    document.getElementById('val-fatalities').innerText = row.total_bajas !== undefined ? Math.round(row.total_bajas) : 0;
    
    const toneVal = row.tono_gdelt !== undefined ? row.tono_gdelt.toFixed(2) : '0.00';
    document.getElementById('val-tone').innerText = toneVal;
    
    const brentVal = row.precio_brent !== undefined ? `$${row.precio_brent.toFixed(2)}` : '$0.00';
    document.getElementById('val-brent').innerText = brentVal;
}

// ML Inference, Map Updates & XAI drivers computation
function runInference(row) {
    if (!modelParams.features || !modelParams.coefs) return;

    const features = modelParams.features;
    const coefs = modelParams.coefs;
    const intercepts = modelParams.intercepts;
    const means = modelParams.means;
    const scales = modelParams.scales;

    // 1. Construct raw feature vector
    let X_raw = new Array(features.length).fill(0.0);
    for (let i = 0; i < features.length; i++) {
        const featName = features[i];
        if (featName === 'pais_Iran') {
            X_raw[i] = currentCountry === 'Iran' ? 1.0 : 0.0;
        } else if (featName === 'pais_Israel') {
            X_raw[i] = currentCountry === 'Israel' ? 1.0 : 0.0;
        } else if (featName === 'pais_United States') {
            X_raw[i] = currentCountry === 'United States' ? 1.0 : 0.0;
        } else {
            const val = row[featName];
            X_raw[i] = val !== undefined && val !== null ? parseFloat(val) : 0.0;
        }
    }

    // 2. Standardize features
    let X_scaled = new Array(features.length);
    for (let i = 0; i < features.length; i++) {
        X_scaled[i] = (X_raw[i] - means[i]) / scales[i];
    }

    // 3. Compute log-odds scores (linear combination)
    let scores = new Array(3).fill(0.0);
    for (let c = 0; c < 3; c++) {
        let sum = 0.0;
        for (let i = 0; i < features.length; i++) {
            sum += coefs[c][i] * X_scaled[i];
        }
        scores[c] = sum + intercepts[c];
    }

    // 4. Softmax to calculate probabilities
    const maxScore = Math.max(...scores);
    let expScores = scores.map(s => Math.exp(s - maxScore));
    const sumExp = expScores.reduce((a, b) => a + b, 0.0);
    let probs = expScores.map(es => es / sumExp);

    // 5. Predicted class
    let maxProbIdx = 0;
    for (let c = 1; c < 3; c++) {
        if (probs[c] > probs[maxProbIdx]) {
            maxProbIdx = c;
        }
    }

    // 6. Update Classification Badge & Probability Bars
    updatePredictionUI(maxProbIdx, probs);

    // 7. Update Map Radar Circles based on escalation class
    updateMapRadar(maxProbIdx);

    // 8. Compute Local Feature Contributions (Explainable AI - XAI)
    explainPrediction(maxProbIdx, X_scaled, features, coefs);

    // 9. Generate Mock Live News Ticker based on target class
    generateNewsFeed(maxProbIdx);
}

// Update the interactive card styles
function updatePredictionUI(predClass, probs) {
    const badge = document.getElementById('prediction-badge');
    const textEl = document.getElementById('predicted-class-text');
    
    const classNames = {
        0: "Baja Escalada (Calma)",
        1: "Media Escalada (Tensión)",
        2: "Alta Escalada (Ataques)"
    };

    badge.className = 'prediction-badge';

    if (predClass === 0) {
        badge.classList.add('status-low');
    } else if (predClass === 1) {
        badge.classList.add('status-medium');
    } else if (predClass === 2) {
        badge.classList.add('status-high');
    }

    textEl.innerText = classNames[predClass];

    const p0 = Math.round(probs[0] * 100);
    const p1 = Math.round(probs[1] * 100);
    const p2 = Math.round(probs[2] * 100);

    document.getElementById('prob-0-text').innerText = `${p0}%`;
    document.getElementById('prob-0-fill').style.width = `${p0}%`;

    document.getElementById('prob-1-text').innerText = `${p1}%`;
    document.getElementById('prob-1-fill').style.width = `${p1}%`;

    document.getElementById('prob-2-text').innerText = `${p2}%`;
    document.getElementById('prob-2-fill').style.width = `${p2}%`;
}

// Update Leaflet dynamic radar radius and color
function updateMapRadar(predClass) {
    if (!map) return;

    // Define colors and radius in meters for classes
    const styles = {
        0: { color: '#34d399', radius: 40000, opacity: 0.15 },
        1: { color: '#fb923c', radius: 90000, opacity: 0.25 },
        2: { color: '#f87171', radius: 150000, opacity: 0.35 }
    };

    const currentStyle = styles[predClass];

    // Update active radar circle on the map
    Object.keys(radarCircles).forEach(country => {
        const circle = radarCircles[country];
        const marker = markers[country];
        
        if (country === currentCountry) {
            // High visibility pulsing style for current actor
            circle.setRadius(currentStyle.radius);
            circle.setStyle({
                color: currentStyle.color,
                fillColor: currentStyle.color,
                fillOpacity: currentStyle.opacity,
                weight: 3
            });
            // Update marker dot color
            marker.setIcon(L.divIcon({
                className: 'custom-div-icon',
                html: `<div class='status-dot' style='background-color:${currentStyle.color};box-shadow: 0 0 12px ${currentStyle.color}; width:14px; height:14px;'></div>`,
                iconSize: [14, 14],
                iconAnchor: [7, 7]
            }));
            marker.setPopupContent(`<b>${country}</b><br>Nivel de escalada: <b>${predClass}</b><br>Situación operacional analizada.`);
        } else {
            // Quiet static style for background actors
            circle.setRadius(35000);
            circle.setStyle({
                color: 'rgba(255,255,255,0.15)',
                fillColor: 'rgba(255,255,255,0.15)',
                fillOpacity: 0.05,
                weight: 1
            });
            marker.setIcon(L.divIcon({
                className: 'custom-div-icon',
                html: `<div class='status-dot' style='background-color:#94a3b8;box-shadow: none; width:10px; height:10px;'></div>`,
                iconSize: [10, 10],
                iconAnchor: [5, 5]
            }));
            marker.setPopupContent(`<b>${country}</b><br>Análisis pasivo.`);
        }
    });
}

// Local Explanation calculation (XAI)
function explainPrediction(predClass, X_scaled, features, coefs) {
    const container = document.getElementById('xai-drivers-container');
    container.innerHTML = ''; // Clear loading placeholder

    // Calculate contribution of each feature to the predicted class score
    // contribution = coef[predClass][i] * X_scaled[i]
    let contributions = [];
    for (let i = 0; i < features.length; i++) {
        const featName = features[i];
        
        // Skip country indicator variables in display for cleaner readability
        if (featName.startsWith('pais_')) continue;

        const val = coefs[predClass][i] * X_scaled[i];
        contributions.push({
            name: featName,
            label: featureTranslations[featName] || featName,
            value: val
        });
    }

    // Sort by absolute contribution magnitude
    contributions.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    // Take top 3 drivers
    const topDrivers = contributions.slice(0, 3);

    topDrivers.forEach(driver => {
        const item = document.createElement('div');
        const isPositive = driver.value >= 0;
        
        item.className = `xai-driver-item ${isPositive ? 'positive' : 'negative'}`;

        const iconClass = isPositive ? 'fa-solid fa-arrow-trend-up' : 'fa-solid fa-arrow-trend-down';
        const directionText = isPositive ? 'Aumenta conflicto' : 'Disminuye conflicto';
        
        item.innerHTML = `
            <div class="driver-icon"><i class="${iconClass}"></i></div>
            <div class="driver-name">${driver.label}</div>
            <div class="driver-value" title="${directionText}">${isPositive ? '+' : ''}${driver.value.toFixed(2)}</div>
        `;
        
        container.appendChild(item);
    });
}

// Generate simulated GDELT News Feed matching current day metrics
function generateNewsFeed(predClass) {
    const container = document.getElementById('news-feed-container');
    const statusText = document.getElementById('feed-status-text');
    container.innerHTML = '';

    // Fetch news template matching country and class
    const templates = headlinesTemplate[currentCountry][predClass];
    
    // Choose 3 random headlines or cycle them based on date key to keep it deterministic per date
    let dateHash = 0;
    for (let i = 0; i < currentDate.length; i++) {
        dateHash += currentDate.charCodeAt(i);
    }

    const indices = [];
    for (let k = 0; k < 3; k++) {
        indices.push((dateHash + k) % templates.length);
    }

    const badgeClasses = {
        0: 'low',
        1: 'medium',
        2: 'high'
    };

    const badgeLabels = {
        0: 'Calma',
        1: 'Tensión',
        2: 'ALERTA'
    };

    indices.forEach(idx => {
        const headline = templates[idx];
        const item = document.createElement('div');
        item.className = 'news-item';
        
        item.innerHTML = `
            <span class="news-badge ${badgeClasses[predClass]}">${badgeLabels[predClass]}</span>
            <div class="news-headline" title="${headline}">${headline}</div>
            <span class="news-time">${currentDate}</span>
        `;
        container.appendChild(item);
    });

    statusText.innerText = `Narrativa: ${predClass === 2 ? 'Crítica (Señales de alerta)' : predClass === 1 ? 'Media (Incertidumbre)' : 'Estable (Calma)'}`;
}

// Chart tab switcher
function switchChart(type) {
    currentChartType = type;
    
    const buttons = document.querySelectorAll('.tab-controls .tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Find button that contains current type in its onclick
    buttons.forEach(btn => {
        if (btn.getAttribute('onclick').includes(type)) {
            btn.classList.add('active');
        }
    });
    
    updateCharts();
}

// Update the Chart.js visual canvas
function updateCharts() {
    const ctx = document.getElementById('main-chart').getContext('2d');
    
    const countryData = dataset.filter(row => row.pais === currentCountry);
    countryData.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    // Downsample data if too long for cleaner rendering (take every 5 days)
    const step = 5;
    const sampledData = [];
    for (let i = 0; i < countryData.length; i += step) {
        sampledData.push(countryData[i]);
    }
    
    const labels = sampledData.map(row => row.fecha);
    
    if (mainChart) {
        mainChart.destroy();
    }

    let datasets = [];
    let options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 10 } }
            },
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 10 } }
            }
        },
        plugins: {
            legend: {
                labels: { color: '#f8fafc', font: { family: 'Outfit', weight: '600', size: 10 } }
            }
        }
    };

    if (currentChartType === 'brent') {
        const brentPrices = sampledData.map(row => row.precio_brent);
        const targets = sampledData.map(row => row.target);

        datasets = [
            {
                label: 'Precio Brent (USD)',
                data: brentPrices,
                borderColor: '#34d399',
                backgroundColor: 'rgba(52, 211, 153, 0.03)',
                borderWidth: 2,
                yAxisID: 'y1',
                type: 'line',
                fill: true,
                tension: 0.3
            },
            {
                label: 'Nivel de Escalada (0-2)',
                data: targets,
                borderColor: 'rgba(251, 146, 60, 0.8)',
                backgroundColor: 'rgba(251, 146, 60, 0.15)',
                borderWidth: 1.5,
                yAxisID: 'y2',
                type: 'line',
                stepped: true
            }
        ];

        options.scales.y1 = {
            type: 'linear',
            position: 'left',
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#34d399' },
            title: { display: true, text: 'Precio Petróleo ($)', color: '#34d399', font: { size: 10 } }
        };
        options.scales.y2 = {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { color: '#fb923c', stepSize: 1, max: 2 },
            title: { display: true, text: 'Target Escalada', color: '#fb923c', font: { size: 10 } }
        };

    } else if (currentChartType === 'nlp') {
        const simAlta = sampledData.map(row => row.score_alta_prom || 0.0);
        const simMedia = sampledData.map(row => row.score_media_prom || 0.0);
        const simBaja = sampledData.map(row => row.score_baja_prom || 0.0);

        datasets = [
            {
                label: 'Similitud Alta (Ataque)',
                data: simAlta,
                borderColor: '#f87171',
                backgroundColor: 'transparent',
                borderWidth: 2,
                tension: 0.3
            },
            {
                label: 'Similitud Media (Tensión)',
                data: simMedia,
                borderColor: '#fb923c',
                backgroundColor: 'transparent',
                borderWidth: 2,
                tension: 0.3
            },
            {
                label: 'Similitud Baja (Calma)',
                data: simBaja,
                borderColor: '#38bdf8',
                backgroundColor: 'transparent',
                borderWidth: 2,
                tension: 0.3
            }
        ];

        options.scales.y = {
            ticks: { color: '#94a3b8' },
            title: { display: true, text: 'Similitud Coseno Promedio', color: '#94a3b8', font: { size: 10 } }
        };

    } else if (currentChartType === 'physical') {
        const explosions = sampledData.map(row => row.n_explosiones || 0);
        const battles = sampledData.map(row => row.n_batallas || 0);
        const protestas = sampledData.map(row => row.n_protestas || 0);

        datasets = [
            {
                label: 'Explosiones / Bombardeos',
                data: explosions,
                backgroundColor: 'rgba(248, 113, 113, 0.4)',
                borderColor: '#f87171',
                borderWidth: 1.5,
                type: 'bar'
            },
            {
                label: 'Batallas Directas',
                data: battles,
                backgroundColor: 'rgba(192, 132, 252, 0.4)',
                borderColor: '#c084fc',
                borderWidth: 1.5,
                type: 'bar'
            },
            {
                label: 'Protestas / Disturbios',
                data: protestas,
                backgroundColor: 'rgba(56, 189, 248, 0.4)',
                borderColor: '#38bdf8',
                borderWidth: 1.5,
                type: 'bar'
            }
        ];

        options.scales.y = {
            ticks: { color: '#94a3b8' },
            title: { display: true, text: 'Total Incidentes (ACLED)', color: '#94a3b8', font: { size: 10 } }
        };
    }

    mainChart = new Chart(ctx, {
        data: {
            labels: labels,
            datasets: datasets
        },
        options: options
    });
}
