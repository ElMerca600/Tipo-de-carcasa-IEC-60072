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

// Etiqueta de cota con placa de fondo: interrumpe la línea/flecha en vez de superponerse al texto.
// align: 'center' (cx = centro), 'end' (cx = borde derecho, para leaders que llegan por la derecha)
function dimLabel(cx, cy, text, align = 'center') {
    const charW = 8.6;
    const w = text.length * charW + 10;
    const h = 18;
    const x = align === 'end' ? cx - w - 6 : cx - w / 2;
    return `<rect x="${x}" y="${cy - h/2}" width="${w}" height="${h}" rx="3" class="dim-label-bg"/><text x="${x + w/2}" y="${cy + 5}" class="dim-text">${text}</text>`;
}

// Anillo de aletas de refrigeración (dientes radiales sólidos).
// skipTest(angleDeg) -> true para omitir un diente en ese ángulo (huecos de caja de bornes, patas, etc.)
function finRing(cx, cy, innerR, outerR, halfW, count, skipTest) {
    let s = '';
    for (let i = 0; i < count; i++) {
        const angleDeg = (360 / count) * i;
        if (skipTest && skipTest(angleDeg)) continue;
        const rad = (angleDeg * Math.PI) / 180;
        const rx = Math.sin(rad), ry = -Math.cos(rad); // vector radial
        const tx = Math.cos(rad), ty = Math.sin(rad);  // vector tangencial
        const p1x = cx + innerR * rx - halfW * tx, p1y = cy + innerR * ry - halfW * ty;
        const p2x = cx + innerR * rx + halfW * tx, p2y = cy + innerR * ry + halfW * ty;
        const p3x = cx + outerR * rx + halfW * 0.45 * tx, p3y = cy + outerR * ry + halfW * 0.45 * ty;
        const p4x = cx + outerR * rx - halfW * 0.45 * tx, p4y = cy + outerR * ry - halfW * 0.45 * ty;
        s += `<polygon points="${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y} ${p4x},${p4y}" class="motor-fin-tooth"/>`;
    }
    return s;
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

    // Aletas de refrigeración (carcasa nervada) - dientes radiales sólidos.
    // Se omiten arriba (hueco para caja de bornes) y abajo (las 3 aletas que interferían con el piso/patas)
    svgHTML += finRing(cx1, cy1, radioEstator - 3, radioEstator + 16, 5.5, 16, angleDeg =>
        (angleDeg > 322 || angleDeg < 38) || (angleDeg > 143 && angleDeg < 217)
    );

    // Caja de bornes (vista superior, proyectada)
    const tbW = sA * 0.26, tbH = sH * 0.22;
    svgHTML += `<rect x="${cx1 - tbW/2}" y="${cy1 - radioEstator - tbH + 5}" width="${tbW}" height="${tbH}" rx="3" class="motor-outline motor-fill"/>`;
    svgHTML += `<line x1="${cx1 - tbW/2}" y1="${cy1 - radioEstator - tbH + 5 + tbH*0.35}" x2="${cx1 + tbW/2}" y2="${cy1 - radioEstator - tbH + 5 + tbH*0.35}" class="motor-seam"/>`;

    // Patas (izq y der) como bloques rectangulares con orificios de fijación
    const pataH = sH * 0.15, pataW = 40;
    const boltR = Math.max(2.5, sD * 0.09);
    [cx1 - sA/2, cx1 + sA/2].forEach(cxFoot => {
        svgHTML += `<rect x="${cxFoot - pataW/2}" y="${cy1 + sH - pataH}" width="${pataW}" height="${pataH}" rx="2" class="motor-outline motor-fill"/>`;
        svgHTML += `<circle cx="${cxFoot - pataW*0.22}" cy="${cy1 + sH - pataH/2}" r="${boltR}" class="bolt-hole"/>`;
        svgHTML += `<circle cx="${cxFoot + pataW*0.22}" cy="${cy1 + sH - pataH/2}" r="${boltR}" class="bolt-hole"/>`;
    });

    // Eje Central
    svgHTML += `<circle cx="${cx1}" cy="${cy1}" r="${sD/2}" class="motor-outline" fill="rgba(102, 252, 241, 0.2)"/>`;

    // Chavetero (esquematico, a las 12h del eje)
    const keyWFront = Math.max(6, sD * 0.32), keyDFront = Math.max(4, sD * 0.16);
    svgHTML += `<rect x="${cx1 - keyWFront/2}" y="${cy1 - sD/2 - keyDFront + 2}" width="${keyWFront}" height="${keyDFront}" class="keyway"/>`;

    // Ejes de simetría
    svgHTML += `<line x1="${cx1}" y1="${cy1 - radioEstator - 20}" x2="${cx1}" y2="${cy1 + sH + 20}" class="motor-axis"/>`;
    svgHTML += `<line x1="${cx1 - radioEstator - 20}" y1="${cy1}" x2="${cx1 + radioEstator + 20}" y2="${cy1}" class="motor-axis"/>`;

    // COTAS (Frontal)
    // Cota H
    svgHTML += `<line x1="${cx1 + 10}" y1="${cy1}" x2="${cx1 + sA/2 + 50}" y2="${cy1}" class="dim-line"/>`;
    svgHTML += `<line x1="${cx1 + sA/2 + 10}" y1="${cy1 + sH}" x2="${cx1 + sA/2 + 50}" y2="${cy1 + sH}" class="dim-line"/>`;
    svgHTML += `<line x1="${cx1 + sA/2 + 35}" y1="${cy1}" x2="${cx1 + sA/2 + 35}" y2="${cy1 + sH}" class="dim-arrow" marker-start="url(#arrow)" marker-end="url(#arrow)"/>`;
    svgHTML += dimLabel(cx1 + sA/2 + 35, cy1 + sH/2, `H=${H}`);

    // Cota A
    const dimY_front = cy1 + sH + 25;
    svgHTML += `<line x1="${cx1 - sA/2}" y1="${cy1 + sH}" x2="${cx1 - sA/2}" y2="${dimY_front + 15}" class="dim-line"/>`;
    svgHTML += `<line x1="${cx1 + sA/2}" y1="${cy1 + sH}" x2="${cx1 + sA/2}" y2="${dimY_front + 15}" class="dim-line"/>`;
    svgHTML += `<line x1="${cx1 - sA/2}" y1="${dimY_front}" x2="${cx1 + sA/2}" y2="${dimY_front}" class="dim-arrow" marker-start="url(#arrow)" marker-end="url(#arrow)"/>`;
    svgHTML += dimLabel(cx1, dimY_front, `A=${A}`);

    // Cota D (leader)
    svgHTML += `<line x1="${cx1}" y1="${cy1}" x2="${cx1 - radioEstator - 15}" y2="${cy1 - radioEstator - 10}" class="dim-line"/>`;
    svgHTML += dimLabel(cx1 - radioEstator - 20, cy1 - radioEstator - 10, `ØD=${D}`, 'end');


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

    // Tapas / uniones carcasa-escudos (costuras de ensamble)
    svgHTML += `<line x1="${inicioCuerpo + largoCuerpo*0.12}" y1="${cy2 - radioEstator}" x2="${inicioCuerpo + largoCuerpo*0.12}" y2="${cy2 + radioEstator}" class="motor-seam"/>`;
    svgHTML += `<line x1="${inicioCuerpo + largoCuerpo*0.86}" y1="${cy2 - radioEstator}" x2="${inicioCuerpo + largoCuerpo*0.86}" y2="${cy2 + radioEstator}" class="motor-seam"/>`;

    // Caja de bornes sobre la carcasa
    const tbWLat = largoCuerpo * 0.22, tbHLat = sH * 0.22;
    const tbXLat = inicioCuerpo + largoCuerpo * 0.32;
    svgHTML += `<rect x="${tbXLat}" y="${cy2 - radioEstator - tbHLat}" width="${tbWLat}" height="${tbHLat}" rx="3" class="motor-outline motor-fill"/>`;
    svgHTML += `<line x1="${tbXLat}" y1="${cy2 - radioEstator - tbHLat + tbHLat*0.3}" x2="${tbXLat + tbWLat}" y2="${cy2 - radioEstator - tbHLat + tbHLat*0.3}" class="motor-seam"/>`;

    // Tapa trasera / cubre-ventilador (extremo N)
    const domeW = largoCuerpo * 0.16;
    const domeX = inicioCuerpo + largoCuerpo;
    svgHTML += `<path d="M ${domeX} ${cy2 - radioEstator} Q ${domeX + domeW} ${cy2} ${domeX} ${cy2 + radioEstator} Z" class="motor-outline motor-fill"/>`;
    for (let i = -2; i <= 2; i++) {
        const yVent = cy2 + i * (radioEstator * 0.32);
        svgHTML += `<line x1="${domeX + domeW*0.2}" y1="${yVent}" x2="${domeX + domeW*0.75}" y2="${yVent}" class="motor-fin"/>`;
    }

    // Rebatimiento ISO E: corte transversal de la carcasa rotado 90° y abatido junto al perfil,
    // para mostrar la disposición de las aletas (no visibles de canto en la vista lateral)
    const rebCx = 1050, rebCy = cy2, rebR = 55;
    svgHTML += `<line x1="${domeX + domeW}" y1="${cy2}" x2="${rebCx - rebR}" y2="${rebCy}" class="rebate-connector"/>`;
    svgHTML += `<circle cx="${rebCx}" cy="${rebCy}" r="${rebR}" class="motor-outline motor-fill"/>`;
    svgHTML += `<circle cx="${rebCx}" cy="${rebCy}" r="${rebR*0.7}" class="motor-inner"/>`;
    svgHTML += finRing(rebCx, rebCy, rebR - 4, rebR + 14, 4.5, 16, null);
    svgHTML += `<line x1="${rebCx}" y1="${rebCy - rebR - 20}" x2="${rebCx}" y2="${rebCy + rebR + 20}" class="motor-axis"/>`;
    svgHTML += `<line x1="${rebCx - rebR - 20}" y1="${rebCy}" x2="${rebCx + rebR + 20}" y2="${rebCy}" class="motor-axis"/>`;
    svgHTML += `<text x="${rebCx}" y="${rebCy + rebR + 35}" class="view-label">REBATIMIENTO</text>`;

    // Patas laterales como bloques rectangulares con orificios ocultos (líneas discontinuas)
    [ejeCentralPata1, ejeCentralPata2].forEach(cxFoot => {
        svgHTML += `<rect x="${cxFoot - 20}" y="${cy2 + sH - pataH}" width="40" height="${pataH}" rx="2" class="motor-outline motor-fill"/>`;
        svgHTML += `<line x1="${cxFoot - 6}" y1="${cy2 + sH - pataH + 2}" x2="${cxFoot - 6}" y2="${cy2 + sH - 2}" class="motor-hidden"/>`;
        svgHTML += `<line x1="${cxFoot + 6}" y1="${cy2 + sH - pataH + 2}" x2="${cxFoot + 6}" y2="${cy2 + sH - 2}" class="motor-hidden"/>`;
    });

    // Eje saliente
    svgHTML += `<rect x="${cxHombro}" y="${cy2 - sD*0.8}" width="${hocico}" height="${sD*1.6}" class="motor-outline"/>`;
    svgHTML += `<rect x="${cxHombro - sE}" y="${cy2 - sD/2}" width="${sE}" height="${sD}" class="motor-outline" fill="rgba(102, 252, 241, 0.2)"/>`;

    // Chavetero sobre el eje saliente
    const keyWLat = sE * 0.55, keyDLat = Math.max(3, sD * 0.16);
    svgHTML += `<rect x="${cxHombro - sE*0.85}" y="${cy2 - sD/2 - keyDLat + 2}" width="${keyWLat}" height="${keyDLat}" class="keyway"/>`;

    // Chaflán en la punta del eje
    svgHTML += `<path d="M ${cxHombro - sE} ${cy2 - sD/2} L ${cxHombro - sE + 5} ${cy2 - sD/2 + 5}" class="motor-outline"/>`;
    svgHTML += `<path d="M ${cxHombro - sE} ${cy2 + sD/2} L ${cxHombro - sE + 5} ${cy2 + sD/2 - 5}" class="motor-outline"/>`;

    // Eje central de simetría horizontal
    svgHTML += `<line x1="${cx2 - sB/2 - sC - sE - 20}" y1="${cy2}" x2="${domeX + domeW + 10}" y2="${cy2}" class="motor-axis"/>`;

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
    svgHTML += dimLabel(cx2, dimY_lat, `B=${B}`);

    // Cota C
    svgHTML += `<line x1="${cxHombro}" y1="${dimY_lat}" x2="${ejeCentralPata1}" y2="${dimY_lat}" class="dim-arrow" marker-start="url(#arrow)" marker-end="url(#arrow)"/>`;
    svgHTML += dimLabel(cxHombro + sC/2, dimY_lat, `C=${C}`);

    // Cota E
    svgHTML += `<line x1="${cxHombro - sE}" y1="${dimY_lat}" x2="${cxHombro}" y2="${dimY_lat}" class="dim-arrow" marker-start="url(#arrow)" marker-end="url(#arrow)"/>`;
    svgHTML += dimLabel(cxHombro - sE/2, dimY_lat, `E=${E}`);

    motorDrawings.innerHTML = svgHTML;
}

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', initSelectors);
