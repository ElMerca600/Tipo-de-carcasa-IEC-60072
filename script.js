// Base de datos IEC 60072-1
const motorData = {
    63: { A: 100, lengths: { 'S': { B: 80 } }, C: 40, D: 11, E: 23 },
    71: { A: 112, lengths: { 'S': { B: 90 } }, C: 45, D: 14, E: 30 },
    80: { A: 125, lengths: { 'S': { B: 100 } }, C: 50, D: 19, E: 40 },
    90: { A: 140, lengths: { 'S': { B: 100 }, 'L': { B: 125 } }, C: 56, D: 24, E: 50 },
    100: { A: 160, lengths: { 'L': { B: 140 } }, C: 63, D: 28, E: 60 },
    112: { A: 190, lengths: { 'M': { B: 140 } }, C: 70, D: 28, E: 60 },
    132: { A: 216, lengths: { 'S': { B: 140 }, 'M': { B: 178 } }, C: 89, D: 38, E: 80 },
    160: { A: 254, lengths: { 'M': { B: 210 }, 'L': { B: 254 } }, C: 108, D: 42, E: 110 },
    180: { A: 279, lengths: { 'M': { B: 241 }, 'L': { B: 279 } }, C: 121, D: 48, E: 110 },
    200: { A: 318, lengths: { 'L': { B: 305 } }, C: 133, D: 55, E: 110 },
    225: { A: 356, lengths: { 'S': { B: 286 }, 'M': { B: 311 } }, C: 149, D: 60, E: 140 },
    250: { A: 406, lengths: { 'M': { B: 349 } }, C: 168, D: 65, E: 140 },
    280: { A: 457, lengths: { 'S': { B: 368 }, 'M': { B: 419 } }, C: 190, D: 75, E: 140 },
    315: { A: 508, lengths: { 'S': { B: 406 }, 'M': { B: 457 }, 'L': { B: 508 } }, C: 216, D: 80, E: 170 }
};

// Elementos de la UI
const carcasaSelect = document.getElementById('carcasaSelect');
const longitudSelect = document.getElementById('longitudSelect');
const svgContainer = document.querySelector('.empty-state');
const motorDrawings = document.getElementById('motorDrawings');

const dataDisplays = {
    H: document.getElementById('valH'),
    A: document.getElementById('valA'),
    B: document.getElementById('valB'),
    C: document.getElementById('valC'),
    D: document.getElementById('valD'),
    E: document.getElementById('valE')
};

const toleranciaNotas = document.getElementById('toleranciaNotas');

// Inicializar selectores
function initSelectors() {
    Object.keys(motorData).forEach(h => {
        const option = document.createElement('option');
        option.value = h;
        option.textContent = `Carcasa ${h} mm`;
        carcasaSelect.appendChild(option);
    });

    carcasaSelect.addEventListener('change', handleCarcasaChange);
    longitudSelect.addEventListener('change', handleLongitudChange);
}

// Manejar cambio de Carcasa (H)
function handleCarcasaChange(e) {
    const hk = e.target.value;
    const motor = motorData[hk];

    longitudSelect.innerHTML = '<option value="" disabled selected>Seleccione Longitud</option>';
    longitudSelect.disabled = false;

    Object.keys(motor.lengths).forEach(len => {
        const option = document.createElement('option');
        option.value = len;
        option.textContent = len === 'S' ? 'Corta (S)' : len === 'M' ? 'Media (M)' : 'Larga (L)';
        longitudSelect.appendChild(option);
    });

    // Reset view if no length selected automatically
    resetDisplay();
}

// Manejar cambio de Longitud
function handleLongitudChange(e) {
    const hk = carcasaSelect.value;
    const len = e.target.value;
    
    if (hk && len) {
        updateDisplay(hk, len);
    }
}

function resetDisplay() {
    Object.values(dataDisplays).forEach(el => el.textContent = '-');
    toleranciaNotas.innerHTML = '<strong>Tolerancias Eje (D):</strong> Esperando selección...';
    svgContainer.style.display = 'block';
    motorDrawings.style.display = 'none';
}

function updateDisplay(h, lengthKey) {
    const motor = motorData[h];
    const b = motor.lengths[lengthKey].B;

    // Actualizar tabla
    dataDisplays.H.textContent = h;
    dataDisplays.A.textContent = motor.A;
    dataDisplays.B.textContent = b;
    dataDisplays.C.textContent = motor.C;
    dataDisplays.D.textContent = motor.D;
    dataDisplays.E.textContent = motor.E;

    // Actualizar notas
    let tolD = motor.D <= 48 ? 'ISO k6' : 'ISO m6';
    toleranciaNotas.innerHTML = `<strong>Tolerancias Eje (D):</strong> ${tolD} para diámetro de ${motor.D}mm`;

    // Renderizar gráfico
    renderSVG(h, motor.A, b, motor.C, motor.D, motor.E);
}

// Punto sobre una circunferencia dado un ángulo en grados (0=derecha, 90=abajo)
function polarPoint(cx, cy, r, angleDeg) {
    const rad = angleDeg * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// Aletas de refrigeración radiales alrededor de la carcasa (vista frontal)
function drawRadialFins(cx, cy, rInner, rOuter, excludedRanges) {
    let html = '';
    const inExcluded = (a) => excludedRanges.some(([start, end]) => a >= start && a <= end);
    for (let angle = 0; angle < 360; angle += 15) {
        if (inExcluded(angle)) continue;
        const p1 = polarPoint(cx, cy, rInner, angle);
        const p2 = polarPoint(cx, cy, rOuter, angle);
        html += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" class="motor-fin"/>`;
    }
    return html;
}

// Caja de bornes (conexión trifásica) montada sobre la carcasa
function drawTerminalBox(cxCenter, yTop, width, height) {
    const x = cxCenter - width / 2;
    let html = `<g class="terminal-box-group">`;
    html += `<rect x="${x}" y="${yTop - height}" width="${width}" height="${height}" rx="3" class="terminal-box"/>`;
    html += `<rect x="${x + width * 0.15}" y="${yTop - height - 6}" width="${width * 0.7}" height="7" rx="2" class="terminal-box-lid"/>`;
    html += `<text x="${cxCenter}" y="${yTop - height / 2 + 4}" class="phase-label">3~</text>`;
    return html + `</g>`;
}

// Chaveta (notch) sobre el eje
function drawKeyway(cx, cy, radius) {
    const w = Math.max(radius * 0.5, 4);
    const h = Math.max(radius * 0.35, 3);
    return `<rect x="${cx - w/2}" y="${cy - radius - h + 1}" width="${w}" height="${h}" class="motor-keyway"/>`;
}

function renderSVG(H, A, B, C, D, E) {
    svgContainer.style.display = 'none';
    motorDrawings.style.display = 'block';

    const cx1 = 250, cy1 = 250; // Centro vista frontal (movido a la izquierda)
    const cx2 = 750, cy2 = 250; // Centro vista lateral
    
    // Escala general ajustada para que las representaciones de gran tamaño no se superpongan
    const scale = 120 / H; 

    const sH = H * scale;
    const sA = A * scale;
    const sB = B * scale;
    const sC = C * scale;
    const sD = D * scale;
    const sE = E * scale;

    let svgHTML = `
        <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--magenta)" />
            </marker>
        </defs>
    `;

    // ----------------------------------------------------
    // VISTA FRONTAL (ALZADO) - Lado del Eje (Izq)
    // ----------------------------------------------------
    svgHTML += `<text x="${cx1}" y="450" class="view-label">VISTA FRONTAL</text>`;
    
    // Base/Suelo
    svgHTML += `<line x1="${cx1 - sA/2 - 50}" y1="${cy1 + sH}" x2="${cx1 + sA/2 + 50}" y2="${cy1 + sH}" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>`;
    
    // Estator Circular (aproximación)
    const radioEstator = sH * 0.9;
    svgHTML += `<circle cx="${cx1}" cy="${cy1}" r="${radioEstator}" class="motor-outline motor-fill"/>`;
    svgHTML += `<circle cx="${cx1}" cy="${cy1}" r="${radioEstator*0.8}" class="motor-inner"/>`;

    // Aletas de refrigeración (perfil acanalado de la carcasa), evitando patas (abajo) y caja de bornes (arriba)
    svgHTML += drawRadialFins(cx1, cy1, radioEstator, radioEstator + 9, [[60, 120], [250, 290]]);

    // Caja de bornes (conexión trifásica L1-L2-L3)
    svgHTML += drawTerminalBox(cx1, cy1 - radioEstator, 70, 34);

    // Placa de características (rating plate) sobre la carcasa
    const npX = cx1 + radioEstator * 0.15, npY = cy1 + radioEstator * 0.35;
    svgHTML += `<rect x="${npX}" y="${npY}" width="46" height="22" rx="3" class="nameplate"/>`;
    [5, 11, 17].forEach(dy => {
        svgHTML += `<line x1="${npX + 5}" y1="${npY + dy}" x2="${npX + 41}" y2="${npY + dy}" class="nameplate-line"/>`;
    });

    // Patas (izq y der)
    const pataH = sH * 0.15;
    svgHTML += `<path d="M ${cx1 - sA/2 - 20} ${cy1 + sH} L ${cx1 - sA/2 + 20} ${cy1 + sH} L ${cx1 - sA/2} ${cy1 + sH - pataH} Z" class="motor-outline"/>`;
    svgHTML += `<path d="M ${cx1 + sA/2 - 20} ${cy1 + sH} L ${cx1 + sA/2 + 20} ${cy1 + sH} L ${cx1 + sA/2} ${cy1 + sH - pataH} Z" class="motor-outline"/>`;
    // Orificios de anclaje en patas
    svgHTML += `<circle cx="${cx1 - sA/2}" cy="${cy1 + sH - pataH*0.4}" r="3.5" class="bolt-hole"/>`;
    svgHTML += `<circle cx="${cx1 + sA/2}" cy="${cy1 + sH - pataH*0.4}" r="3.5" class="bolt-hole"/>`;

    // Eje Central
    svgHTML += `<circle cx="${cx1}" cy="${cy1}" r="${sD/2}" class="motor-outline" fill="rgba(102, 252, 241, 0.2)"/>`;
    // Chavetero del eje
    svgHTML += drawKeyway(cx1, cy1, sD/2);

    // Ejes de simetría
    svgHTML += `<line x1="${cx1}" y1="${cy1 - radioEstator - 20}" x2="${cx1}" y2="${cy1 + sH + 20}" class="motor-axis"/>`;
    svgHTML += `<line x1="${cx1 - radioEstator - 20}" y1="${cy1}" x2="${cx1 + radioEstator + 20}" y2="${cy1}" class="motor-axis"/>`;

    // COTAS (Frontal)
    // Cota H
    svgHTML += `<line x1="${cx1 + 10}" y1="${cy1}" x2="${cx1 + sA/2 + 50}" y2="${cy1}" class="dim-line"/>`;
    svgHTML += `<line x1="${cx1 + sA/2 + 10}" y1="${cy1 + sH}" x2="${cx1 + sA/2 + 50}" y2="${cy1 + sH}" class="dim-line"/>`;
    svgHTML += `<line x1="${cx1 + sA/2 + 35}" y1="${cy1}" x2="${cx1 + sA/2 + 35}" y2="${cy1 + sH}" class="dim-arrow" marker-start="url(#arrow)" marker-end="url(#arrow)"/>`;
    svgHTML += `<text x="${cx1 + sA/2 + 55}" y="${cy1 + sH/2 + 5}" class="dim-text">H=${H}</text>`;

    // Cota A
    const dimY_front = cy1 + sH + 25;
    svgHTML += `<line x1="${cx1 - sA/2}" y1="${cy1 + sH}" x2="${cx1 - sA/2}" y2="${dimY_front + 15}" class="dim-line"/>`;
    svgHTML += `<line x1="${cx1 + sA/2}" y1="${cy1 + sH}" x2="${cx1 + sA/2}" y2="${dimY_front + 15}" class="dim-line"/>`;
    svgHTML += `<line x1="${cx1 - sA/2}" y1="${dimY_front}" x2="${cx1 + sA/2}" y2="${dimY_front}" class="dim-arrow" marker-start="url(#arrow)" marker-end="url(#arrow)"/>`;
    svgHTML += `<text x="${cx1}" y="${dimY_front - 5}" class="dim-text">A=${A}</text>`;

    // Cota D
    svgHTML += `<line x1="${cx1}" y1="${cy1}" x2="${cx1 - radioEstator - 15}" y2="${cy1 - radioEstator - 10}" class="dim-line"/>`;
    svgHTML += `<text x="${cx1 - radioEstator - 25}" y="${cy1 - radioEstator - 15}" class="dim-text">ØD=${D}</text>`;


    // ----------------------------------------------------
    // VISTA LATERAL IZQUIERDA (ISO E, proyectada a la derecha)
    // ----------------------------------------------------
    svgHTML += `<text x="${cx2}" y="450" class="view-label">VISTA LATERAL (ISO E)</text>`;
    
    // Base/Suelo
    svgHTML += `<line x1="${cx2 - sB/2 - sC - sE - 20}" y1="${cy2 + sH}" x2="${cx2 + sB/2 + 50}" y2="${cy2 + sH}" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>`;

    // Patas laterales
    const ejeCentralPata1 = cx2 - sB/2;
    const ejeCentralPata2 = cx2 + sB/2;

    const cxHombro = ejeCentralPata1 - sC;
    const hocico = 15;
    const inicioCuerpo = cxHombro + hocico; 
    
    // Cuerpo Rectangular (Carcasa lateral)
    const largoCuerpo = sB * 1.5;
    svgHTML += `<rect x="${inicioCuerpo}" y="${cy2 - radioEstator}" width="${largoCuerpo}" height="${radioEstator * 2}" class="motor-outline motor-fill" rx="10"/>`;

    // Aletas de refrigeración longitudinales sobre la carcasa
    const finZoneStart = inicioCuerpo + largoCuerpo * 0.12;
    const finZoneEnd = inicioCuerpo + largoCuerpo * 0.88;
    for (let fx = finZoneStart; fx <= finZoneEnd; fx += 12) {
        svgHTML += `<line x1="${fx}" y1="${cy2 - radioEstator + 6}" x2="${fx}" y2="${cy2 + radioEstator - 6}" class="motor-fin"/>`;
    }

    // Escudos (tapas rodamiento lado acople NDE/DE)
    const escudoDE = inicioCuerpo + largoCuerpo * 0.1;
    const escudoNDE = inicioCuerpo + largoCuerpo * 0.9;
    svgHTML += `<line x1="${escudoDE}" y1="${cy2 - radioEstator}" x2="${escudoDE}" y2="${cy2 + radioEstator}" class="end-shield"/>`;
    svgHTML += `<line x1="${escudoNDE}" y1="${cy2 - radioEstator}" x2="${escudoNDE}" y2="${cy2 + radioEstator}" class="end-shield"/>`;

    // Caja de bornes (conexión trifásica) sobre la carcasa
    svgHTML += drawTerminalBox(inicioCuerpo + largoCuerpo * 0.5, cy2 - radioEstator, 70, 34);
    svgHTML += `<text x="${inicioCuerpo + largoCuerpo * 0.5}" y="${cy2 - radioEstator - 44}" class="detail-label">CAJA DE BORNES</text>`;

    // Tapa de ventilador (lado opuesto al eje - NDE) con rejilla de refrigeración
    const fanCx = inicioCuerpo + largoCuerpo;
    const fanRy = radioEstator;
    const fanBulge = 26;
    svgHTML += `<path d="M ${fanCx} ${cy2 - fanRy} A ${fanBulge} ${fanRy} 0 0 1 ${fanCx} ${cy2 + fanRy}" class="motor-outline motor-fill"/>`;
    [0.35, 0.6, 0.85].forEach(f => {
        svgHTML += `<path d="M ${fanCx + 2} ${cy2 - fanRy*f} A ${fanBulge*f} ${fanRy*f} 0 0 1 ${fanCx + 2} ${cy2 + fanRy*f}" class="fan-grille"/>`;
    });
    svgHTML += `<circle cx="${fanCx + fanBulge*0.55}" cy="${cy2}" r="4" class="bolt-hole"/>`;
    svgHTML += `<text x="${fanCx + fanBulge/2}" y="${cy2 + fanRy + 30}" class="detail-label">TAPA VENTILADOR</text>`;

    // Patas laterales en forma de triángulo proyectado
    svgHTML += `<path d="M ${ejeCentralPata1 - 20} ${cy2 + sH} L ${ejeCentralPata1 + 20} ${cy2 + sH} L ${ejeCentralPata1} ${cy2 + sH - pataH} Z" class="motor-outline"/>`;
    svgHTML += `<path d="M ${ejeCentralPata2 - 20} ${cy2 + sH} L ${ejeCentralPata2 + 20} ${cy2 + sH} L ${ejeCentralPata2} ${cy2 + sH - pataH} Z" class="motor-outline"/>`;
    // Orificios de anclaje en patas
    svgHTML += `<circle cx="${ejeCentralPata1}" cy="${cy2 + sH - pataH*0.4}" r="3.5" class="bolt-hole"/>`;
    svgHTML += `<circle cx="${ejeCentralPata2}" cy="${cy2 + sH - pataH*0.4}" r="3.5" class="bolt-hole"/>`;

    // Eje saliente
    svgHTML += `<rect x="${cxHombro}" y="${cy2 - sD*0.8}" width="${hocico}" height="${sD*1.6}" class="motor-outline"/>`;
    svgHTML += `<rect x="${cxHombro - sE}" y="${cy2 - sD/2}" width="${sE}" height="${sD}" class="motor-outline" fill="rgba(102, 252, 241, 0.2)"/>`;
    // Chavetero del eje
    svgHTML += drawKeyway(cxHombro - sE/2, cy2, sD/2);

    // Eje central de simetría horizontal
    svgHTML += `<line x1="${cx2 - sB/2 - sC - sE - 20}" y1="${cy2}" x2="${cx2 + sB/2 + 50}" y2="${cy2}" class="motor-axis"/>`;

    // ALTURA COMPARTIDA PARA COTAS A, E, C, B
    const dimY_lat = cy2 + sH + 25;

    // Lineas agujeros (verticales extendidas hacia abajo)
    svgHTML += `<line x1="${ejeCentralPata1}" y1="${cy2 + sH - pataH - 10}" x2="${ejeCentralPata1}" y2="${dimY_lat + 15}" class="motor-axis"/>`;
    svgHTML += `<line x1="${ejeCentralPata2}" y1="${cy2 + sH - pataH - 10}" x2="${ejeCentralPata2}" y2="${dimY_lat + 15}" class="motor-axis"/>`;
    svgHTML += `<line x1="${cxHombro}" y1="${cy2}" x2="${cxHombro}" y2="${dimY_lat + 15}" class="motor-axis"/>`;
    svgHTML += `<line x1="${cxHombro - sE}" y1="${cy2}" x2="${cxHombro - sE}" y2="${dimY_lat + 15}" class="motor-axis"/>`;

    // COTAS (Lateral) Alineadas E, C, B
    // Cota B
    svgHTML += `<line x1="${ejeCentralPata1}" y1="${dimY_lat}" x2="${ejeCentralPata2}" y2="${dimY_lat}" class="dim-arrow" marker-start="url(#arrow)" marker-end="url(#arrow)"/>`;
    svgHTML += `<text x="${cx2}" y="${dimY_lat - 5}" class="dim-text">B=${B}</text>`;

    // Cota C
    svgHTML += `<line x1="${cxHombro}" y1="${dimY_lat}" x2="${ejeCentralPata1}" y2="${dimY_lat}" class="dim-arrow" marker-start="url(#arrow)" marker-end="url(#arrow)"/>`;
    svgHTML += `<text x="${cxHombro + sC/2}" y="${dimY_lat - 5}" class="dim-text">C=${C}</text>`;

    // Cota E
    svgHTML += `<line x1="${cxHombro - sE}" y1="${dimY_lat}" x2="${cxHombro}" y2="${dimY_lat}" class="dim-arrow" marker-start="url(#arrow)" marker-end="url(#arrow)"/>`;
    svgHTML += `<text x="${cxHombro - sE/2}" y="${dimY_lat - 5}" class="dim-text">E=${E}</text>`;

    motorDrawings.innerHTML = svgHTML;
}

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', initSelectors);
