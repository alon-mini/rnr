// Constants and utilities
const svgNS = "http://www.w3.org/2000/svg";
function el(tag, attrs = {}) {
    const e = document.createElementNS(svgNS, tag);
    for (let k in attrs) e.setAttribute(k, attrs[k]);
    return e;
}

const mapLayer = document.getElementById('map-layer');
const itemsLayer = document.getElementById('items-layer');
const actorsLayer = document.getElementById('actors-layer');
const bubblesLayer = document.getElementById('bubbles-layer');

const COLORS = {
    'x': null,
    'k': '#1a1a1a', // black
    'w': '#ffffff', // white
    'r': '#d03e3e', // red
    'b': '#2c5e9e', // blue
    'n': '#5c3a21', // brown hair
    'l': '#e6c229', // blond hair
    's': '#fcd2b3', // light skin
    'c': '#8d5524', // dark skin
    'd': '#333333', // dark grey (shirts/pants)
    'g': '#94a3b8', // grey
    'p': '#d27d96', // pink/magenta
    'u': '#111827'  // very dark blue/black
};

// 16x16 pixel sprites
const spriteMap = {
    proc1: [ // spiky brown hair, white shirt
        "xxxkknnnkxxxxxxx",
        "xxknnnnnnkxxxxxx",
        "xxkksnnnskkxxxxx",
        "xxkskwkckxxxxxxx", // c is skin shade
        "xxkssssskxxxxxxx",
        "xxxkwwwkxxxxxxxx",
        "xxkwwwwwkxxxxxxx",
        "xxkwwwwwkxxxxxxx",
        "xxxkwwwkxxxxxxxx",
        "xxxkdddkxxxxxxxx",
        "xxxkdddkxxxxxxxx",
        "xxxbbxbbxxxxxxxx",
        "xxxkkxkkxxxxxxxx",
        "xxxxxxxxxxxxxxxx",
        "xxxxxxxxxxxxxxxx",
        "xxxxxxxxxxxxxxxx"
    ],
    proc2: [ // blond, dark blue shirt with white
        "xxxkklllkxxxxxxx",
        "xxkllllllkxxxxxx",
        "xxkksnnnskkxxxxx",
        "xxkskwkskxxxxxxx",
        "xxkssssskxxxxxxx",
        "xxxkbbbkxxxxxxxx",
        "xxkbbbbbkxxxxxxx",
        "xxkbbbbbkxxxxxxx",
        "xxkwbbbwkxxxxxxx",
        "xxxkbbbkxxxxxxxx",
        "xxxkdddkxxxxxxxx",
        "xxxkdddkxxxxxxxx",
        "xxxkkxkkxxxxxxxx",
        "xxxxxxxxxxxxxxxx",
        "xxxxxxxxxxxxxxxx",
        "xxxxxxxxxxxxxxxx"
    ],
    orchestrator: [ // black hair girl, red shirt
        "xxxkkkkkxxxxxxxx",
        "xxkkkkkkkxxxxxxx",
        "xxkksnnnskkxxxxx",
        "xxkskwkskxxxxxxx",
        "xxkssssskxxxxxxx",
        "xxxkrrrkxxxxxxxx",
        "xxkrrrrrkxxxxxxx",
        "xxkrrrrrkxxxxxxx",
        "xxxkrrrkxxxxxxxx",
        "xxxkdddkxxxxxxxx",
        "xxxkdddkxxxxxxxx",
        "xxxxsxsxxxxxxxxx",
        "xxxnnxnnxxxxxxxx",
        "xxxxxxxxxxxxxxxx",
        "xxxxxxxxxxxxxxxx",
        "xxxxxxxxxxxxxxxx"
    ],
    extractor: [ // afro guy, red shirt
        "xxkkkkkkkxxxxxxx",
        "xkkkkkkkkkxxxxxx",
        "xkkccccckkxxxxxx",
        "xkcclkcwkcxxxxxx",
        "xkcccccccxxxxxxx",
        "xxxkrrrkxxxxxxxx",
        "xxkrrrrrkxxxxxxx",
        "xxkrrrrrkxxxxxxx",
        "xxxkrrrkxxxxxxxx",
        "xxxkbbbkxxxxxxxx",
        "xxxkbbbkxxxxxxxx",
        "xxxbbxbbxxxxxxxx",
        "xxxkkxkkxxxxxxxx",
        "xxxxxxxxxxxxxxxx",
        "xxxxxxxxxxxxxxxx",
        "xxxxxxxxxxxxxxxx"
    ],
    clarifier: [ // blonde girl sitting
        "xxxkklllkxxxxxxx",
        "xxkllllllkxxxxxx",
        "xxkksnnnskkxxxxx",
        "xxkskwkskxxxxxxx",
        "xxkssssskxxxxxxx",
        "xxxkdddkxxxxxxxx",
        "xxkdddddkxxxxxxx",
        "xxkddddddkxxxxxx",
        "xxxkddddkxxxxxxx",
        "xxxxskssxxxxxxxx",
        "xxxxxxxxxxxxxxxx",
        "xxxxxxxxxxxxxxxx",
        "xxxxxxxxxxxxxxxx",
        "xxxxxxxxxxxxxxxx",
        "xxxxxxxxxxxxxxxx",
        "xxxxxxxxxxxxxxxx"
    ],
    researcher: [ // white hair guy sitting
        "xxxkkwwwkxxxxxxx",
        "xxkwwwwwwkxxxxxx",
        "xxkksnnnskkxxxxx",
        "xxkskwkskxxxxxxx",
        "xxkssssskxxxxxxx",
        "xxxkwwwkxxxxxxxx",
        "xxkwwwwwkxxxxxxx",
        "xxkwwwwwkxxxxxxx",
        "xxxkwwwwkxxxxxxx",
        "xxxxskssxxxxxxxx",
        "xxxxxxxxxxxxxxxx",
        "xxxxxxxxxxxxxxxx",
        "xxxxxxxxxxxxxxxx",
        "xxxxxxxxxxxxxxxx",
        "xxxxxxxxxxxxxxxx",
        "xxxxxxxxxxxxxxxx"
    ],
    assembler: [ // generic bot/helper for assembler
        "xxxxxxxxxxxxxxxx",
        "xxxkkkkkkxxxxxxx",
        "xxkkbbbbkkxxxxxx",
        "xxkbwwwwbkxxxxxx",
        "xxkbbbbbbkxxxxxx",
        "xxxkkkkkkxxxxxxx",
        "xxkkggggkkxxxxxx",
        "xkkggggggkkxxxxx",
        "xkkggggggkkxxxxx",
        "xxxxddddxxxxxxxx",
        "xxxxddddxxxxxxxx",
        "xxxbbxxbbxxxxxxx",
        "xxxkkxxkkxxxxxxx",
        "xxxxxxxxxxxxxxxx",
        "xxxxxxxxxxxxxxxx",
        "xxxxxxxxxxxxxxxx"
    ]
};

function drawSprite(templateName, x, y, scale = 2.5) {
    const group = el('g', { transform: `translate(${x}, ${y})` });
    const lines = spriteMap[templateName];

    lines.forEach((line, row) => {
        for (let col = 0; col < line.length; col++) {
            const char = line[col];
            if (char === 'x') continue;

            let fill = COLORS[char];

            const rect = el('rect', {
                x: col * scale - (16 * scale / 2),
                y: row * scale - (16 * scale), // anchor at bottom center
                width: scale + 0.5,
                height: scale + 0.5,
                fill: fill,
                'shape-rendering': 'crispEdges'
            });
            group.appendChild(rect);
        }
    });

    // Add a small drop shadow ellipse under the character
    const shadow = el('ellipse', { cx: 0, cy: 0, rx: 8, ry: 3, fill: 'rgba(0,0,0,0.3)' });
    group.insertBefore(shadow, group.firstChild);

    return group;
}

// Scenery Generators
function drawDesk(x, y, labelText, type = 'up') {
    const group = el('g', { transform: `translate(${x}, ${y})` });

    // Wooden desk pixel art style
    group.appendChild(el('rect', { x: -35, y: -20, width: 70, height: 40, fill: '#ba7941', rx: 2 }));
    group.appendChild(el('rect', { x: -35, y: -20, width: 70, height: 40, fill: 'none', stroke: '#8c5020', 'stroke-width': 3, rx: 2 }));
    group.appendChild(el('rect', { x: -35, y: 17, width: 70, height: 3, fill: '#6e3c15' })); // bottom lip

    // Monitor
    if (type === 'up') {
        group.appendChild(el('rect', { x: -12, y: -15, width: 24, height: 18, fill: '#cbd5e1', rx: 2 }));
        group.appendChild(el('rect', { x: -10, y: -13, width: 20, height: 14, fill: '#1e293b', class: 'screen', id: `screen-${labelText.replace(/\s+/g, '-')}` }));
        group.appendChild(el('rect', { x: -12, y: -15, width: 24, height: 18, fill: 'none', stroke: '#64748b', 'stroke-width': 2, rx: 2 }));
    } else {
        group.appendChild(el('rect', { x: -12, y: -5, width: 24, height: 18, fill: '#cbd5e1', rx: 2 }));
        group.appendChild(el('rect', { x: -10, y: -3, width: 20, height: 14, fill: '#1e293b', class: 'screen', id: `screen-${labelText.replace(/\s+/g, '-')}` }));
        group.appendChild(el('rect', { x: -12, y: -5, width: 24, height: 18, fill: 'none', stroke: '#64748b', 'stroke-width': 2, rx: 2 }));
    }

    // Coffee mug & papers
    group.appendChild(el('rect', { x: 18, y: -8, width: 6, height: 8, fill: '#ffffff', rx: 1 }));
    group.appendChild(el('rect', { x: -28, y: -5, width: 12, height: 15, fill: '#f8fafc', rx: 1 }));
    group.appendChild(el('line', { x1: -26, y1: -2, x2: -18, y2: -2, stroke: '#94a3b8', 'stroke-width': 1 }));
    group.appendChild(el('line', { x1: -26, y1: 2, x2: -18, y2: 2, stroke: '#94a3b8', 'stroke-width': 1 }));

    // Label
    const text = el('text', { x: 0, y: 35, fill: '#94a3b8', 'font-size': '10', 'font-family': 'monospace', 'text-anchor': 'middle' });
    text.textContent = labelText;
    group.appendChild(text);

    // Stool
    if (type === 'up') {
        group.appendChild(el('ellipse', { cx: 0, cy: 30, rx: 10, ry: 7, fill: '#e6c229', stroke: '#c09b11', 'stroke-width': 2 }));
    } else {
        group.appendChild(el('ellipse', { cx: 0, cy: -30, rx: 10, ry: 7, fill: '#e6c229', stroke: '#c09b11', 'stroke-width': 2 }));
    }

    return group;
}

function drawBookshelf(x, y, width = 60) {
    const group = el('g', { transform: `translate(${x}, ${y})` });
    group.appendChild(el('rect', { x: -width / 2, y: -15, width: width, height: 30, fill: '#a26233', stroke: '#5e3415', 'stroke-width': 3 }));
    group.appendChild(el('line', { x1: -width / 2 + 2, y1: 0, x2: width / 2 - 2, y2: 0, stroke: '#5e3415', 'stroke-width': 3 }));

    // Books
    const colors = ['#d03e3e', '#2c5e9e', '#e6c229', '#ffffff', '#94a3b8'];
    for (let i = 0; i < 8; i++) {
        const bx = -width / 2 + 5 + i * 6;
        if (Math.random() > 0.3) {
            group.appendChild(el('rect', { x: bx, y: -12, width: 4, height: 10, fill: colors[Math.floor(Math.random() * colors.length)] }));
        }
        if (Math.random() > 0.3) {
            group.appendChild(el('rect', { x: bx, y: 3, width: 4, height: 10, fill: colors[Math.floor(Math.random() * colors.length)] }));
        }
    }
    return group;
}

function drawPlant(x, y) {
    const group = el('g', { transform: `translate(${x}, ${y})` });
    group.appendChild(el('rect', { x: -8, y: 5, width: 16, height: 12, fill: '#c28b5e', stroke: '#8c5020', 'stroke-width': 2, rx: 2 }));
    group.appendChild(el('path', { d: "M0,5 Q-15,-10 0,-20 Q15,-10 0,5", fill: '#4ade80', stroke: '#16a34a', 'stroke-width': 2 }));
    group.appendChild(el('path', { d: "M-4,5 Q-20,-5 -15,-15 Q0,-10 -4,5", fill: '#4ade80', stroke: '#16a34a', 'stroke-width': 2 }));
    group.appendChild(el('path', { d: "M4,5 Q20,-5 15,-15 Q0,-10 4,5", fill: '#4ade80', stroke: '#16a34a', 'stroke-width': 2 }));
    return group;
}

function drawBoxes(x, y) {
    const group = el('g', { transform: `translate(${x}, ${y})` });
    group.appendChild(el('rect', { x: -15, y: -10, width: 20, height: 20, fill: '#d9a05b', stroke: '#8c5020', 'stroke-width': 2 }));
    group.appendChild(el('rect', { x: -5, y: -20, width: 20, height: 20, fill: '#d9a05b', stroke: '#8c5020', 'stroke-width': 2 }));
    group.appendChild(el('rect', { x: 5, y: -5, width: 22, height: 15, fill: '#d9a05b', stroke: '#8c5020', 'stroke-width': 2 }));
    // Tape
    group.appendChild(el('line', { x1: -15, y1: 0, x2: 5, y2: 0, stroke: '#facc15', 'stroke-width': 2 }));
    group.appendChild(el('line', { x1: -5, y1: -10, x2: 15, y2: -10, stroke: '#facc15', 'stroke-width': 2 }));
    return group;
}

function drawVendingMachine(x, y) {
    const group = el('g', { transform: `translate(${x}, ${y})` });
    group.appendChild(el('rect', { x: -20, y: -35, width: 40, height: 70, fill: '#e2e8f0', stroke: '#94a3b8', 'stroke-width': 3 }));
    group.appendChild(el('rect', { x: -14, y: -28, width: 28, height: 45, fill: '#1e293b', stroke: '#334155', 'stroke-width': 2 }));
    // Drinks
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            group.appendChild(el('rect', { x: -10 + c * 9, y: -24 + r * 15, width: 5, height: 8, fill: r % 2 == 0 ? '#ef4444' : '#3b82f6' }));
        }
    }
    group.appendChild(el('rect', { x: -14, y: 22, width: 28, height: 8, fill: '#0f172a' })); // dispense slot
    return group;
}

function drawWaterCooler(x, y) {
    const group = el('g', { transform: `translate(${x}, ${y})` });
    group.appendChild(el('rect', { x: -10, y: -5, width: 20, height: 35, fill: '#f8fafc', stroke: '#94a3b8', 'stroke-width': 2 }));
    // Jug
    group.appendChild(el('rect', { x: -8, y: -25, width: 16, height: 20, fill: 'rgba(56, 189, 248, 0.5)', stroke: '#38bdf8', 'stroke-width': 2, rx: 4 }));
    return group;
}

function drawKitchenCounter(x, y) {
    const group = el('g', { transform: `translate(${x}, ${y})` });
    group.appendChild(el('rect', { x: -40, y: -15, width: 80, height: 30, fill: '#f1f5f9', stroke: '#cbd5e1', 'stroke-width': 3 }));
    group.appendChild(el('rect', { x: -35, y: -10, width: 25, height: 20, fill: '#e2e8f0', stroke: '#94a3b8', 'stroke-width': 2 })); // sink
    group.appendChild(el('circle', { cx: -22.5, cy: -10, r: 2, fill: '#64748b' })); // faucet base
    return group;
}

function drawFridge(x, y) {
    const group = el('g', { transform: `translate(${x}, ${y})` });
    group.appendChild(el('rect', { x: -15, y: -30, width: 30, height: 60, fill: '#f8fafc', stroke: '#94a3b8', 'stroke-width': 3 }));
    group.appendChild(el('line', { x1: -15, y1: -5, x2: 15, y2: -5, stroke: '#94a3b8', 'stroke-width': 3 })); // freezer split
    group.appendChild(el('line', { x1: -10, y1: -20, x2: -10, y2: -12, stroke: '#cbd5e1', 'stroke-width': 2 })); // handle 1
    group.appendChild(el('line', { x1: -10, y1: 5, x2: -10, y2: 15, stroke: '#cbd5e1', 'stroke-width': 2 })); // handle 2
    return group;
}

function drawLounge(x, y) {
    const group = el('g', { transform: `translate(${x}, ${y})` });
    // Left couch (pink)
    group.appendChild(el('rect', { x: -45, y: -20, width: 20, height: 40, fill: '#e879f9', stroke: '#c026d3', 'stroke-width': 2, rx: 3 }));
    // Right couch (pink)
    group.appendChild(el('rect', { x: 25, y: -20, width: 20, height: 40, fill: '#e879f9', stroke: '#c026d3', 'stroke-width': 2, rx: 3 }));
    // Coffee table
    group.appendChild(el('rect', { x: -15, y: -15, width: 30, height: 30, fill: '#d9a05b', stroke: '#8c5020', 'stroke-width': 3, rx: 2 }));
    // Mugs on table
    group.appendChild(el('rect', { x: -5, y: -5, width: 5, height: 6, fill: '#ffffff' }));
    group.appendChild(el('rect', { x: 5, y: 2, width: 5, height: 6, fill: '#ffffff' }));

    // Picture on wall
    group.appendChild(el('rect', { x: -25, y: -60, width: 50, height: 25, fill: '#8b5cf6', stroke: '#d9a05b', 'stroke-width': 4 }));
    group.appendChild(el('circle', { cx: -10, cy: -55, r: 4, fill: '#facc15' })); // sun
    group.appendChild(el('path', { d: "M-25,-40 L-10,-50 L5,-40 L15,-45 L25,-40 L25,-35 L-25,-35 Z", fill: '#4ade80' })); // mountains

    return group;
}

const LOCS = {
    // Left Room (Main Office)
    extractor: { x: 300, y: 150 }, // top left desk
    proc2: { x: 300, y: 350 },     // bottom left desk
    proc1: { x: 450, y: 150 },     // top right desk
    assembler: { x: 450, y: 350 }, // bottom right desk
    inbox: { x: 200, y: 250 },     // Orchestrator starts around here walking

    // Top right (Kitchen)
    outbox: { x: 670, y: 150 },    // the final destination, acts as "inbox" of requests maybe
    kitchenCenter: { x: 670, y: 150 },

    // Bottom right (Lounge)
    researcher: { x: 690, y: 460 }, // right side of lounge table
    clarifier: { x: 630, y: 460 },  // left side of lounge table
};

// --- DRAW SCENERY ---
// Main room props
mapLayer.appendChild(drawBookshelf(250, 40, 80));
mapLayer.appendChild(drawBookshelf(450, 40, 80));
mapLayer.appendChild(drawBoxes(250, 80));
mapLayer.appendChild(drawPlant(200, 80));
mapLayer.appendChild(drawPlant(200, 450));
mapLayer.appendChild(drawPlant(500, 450));

// Kitchen
mapLayer.appendChild(drawVendingMachine(560, 60));
mapLayer.appendChild(drawWaterCooler(620, 75));
mapLayer.appendChild(drawKitchenCounter(720, 65));
mapLayer.appendChild(drawFridge(790, 60));
mapLayer.appendChild(el('circle', { cx: 680, cy: 30, r: 10, fill: '#f8fafc', stroke: '#94a3b8', 'stroke-width': 2 })); // wall clock
mapLayer.appendChild(el('line', { x1: 680, y1: 30, x2: 680, y2: 24, stroke: '#334155', 'stroke-width': 2 })); // clock hand

// Lounge
mapLayer.appendChild(drawBookshelf(580, 310, 60));
mapLayer.appendChild(drawBookshelf(800, 310, 60));
mapLayer.appendChild(drawPlant(650, 310));
mapLayer.appendChild(drawPlant(740, 310));
mapLayer.appendChild(drawPlant(550, 500));
mapLayer.appendChild(drawPlant(820, 500));
mapLayer.appendChild(drawLounge(660, 460));


// Draw Desks
mapLayer.appendChild(drawDesk(LOCS.extractor.x, LOCS.extractor.y, 'rnr-extractor', 'up'));
mapLayer.appendChild(drawDesk(LOCS.proc1.x, LOCS.proc1.y, 'rnr-proc-1', 'up'));
mapLayer.appendChild(drawDesk(LOCS.proc2.x, LOCS.proc2.y, 'rnr-proc-2', 'down'));
mapLayer.appendChild(drawDesk(LOCS.assembler.x, LOCS.assembler.y, 'rnr-assembler', 'down'));

// --- ACTORS ---
const orchestrator = drawSprite('orchestrator', LOCS.inbox.x, LOCS.inbox.y);
actorsLayer.appendChild(orchestrator);

// Processors at top desks
const extractor = drawSprite('extractor', LOCS.extractor.x, LOCS.extractor.y + 15);
actorsLayer.appendChild(extractor);

const proc1 = drawSprite('proc1', LOCS.proc1.x, LOCS.proc1.y + 15);
actorsLayer.appendChild(proc1);

// Processors at bottom desks (facing up)
const proc2 = drawSprite('proc2', LOCS.proc2.x, LOCS.proc2.y - 15);
actorsLayer.appendChild(proc2);

const assembler = drawSprite('assembler', LOCS.assembler.x, LOCS.assembler.y - 15);
actorsLayer.appendChild(assembler);

// Lounge chars
const clarifier = drawSprite('clarifier', LOCS.clarifier.x, LOCS.clarifier.y + 5);
actorsLayer.appendChild(clarifier);
const researcher = drawSprite('researcher', LOCS.researcher.x, LOCS.researcher.y + 5);
actorsLayer.appendChild(researcher);


function drawDocument(x, y, isSmall = false, isGold = false) {
    const group = el('g', { transform: `translate(${x}, ${y})`, class: 'document' });
    const w = isSmall ? 25 : 40;
    const h = isSmall ? 35 : 56;

    const doc = el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: isGold ? '#facc15' : '#f8fafc', rx: 2, filter: 'url(#drop-shadow)' });
    group.appendChild(doc);

    // lines
    const lineX = -w / 2 + 6;
    const lineW = w - 12;
    const lineC = isGold ? '#d97706' : '#94a3b8';
    for (let i = 0; i < (isSmall ? 3 : 5); i++) {
        group.appendChild(el('rect', { x: lineX, y: -h / 2 + 10 + i * 8, width: lineW * (i % 2 == 0 ? 1 : 0.7), height: 3, fill: lineC, rx: 1 }));
    }
    return group;
}

function createSpeechBubble(x, y, textList, type = 'normal') {
    const group = el('g', { transform: `translate(${x}, ${y - 60})`, opacity: 0 });

    let bgCol = '#ffffff';
    let txtCol = '#0f172a';
    if (type === 'alert') { bgCol = '#ef4444'; txtCol = '#ffffff'; }
    if (type === 'think') { bgCol = '#8b5cf6'; txtCol = '#ffffff'; }
    if (type === 'terminal') { bgCol = '#000000'; txtCol = '#10b981'; }

    const bg = el('rect', { x: -60, y: -40, width: 120, height: 35, fill: bgCol, rx: 8, filter: 'url(#drop-shadow)' });
    group.appendChild(bg);

    const pointer = el('polygon', { points: "-5, -5 5, -5 0, 10", fill: bgCol });
    group.appendChild(pointer);

    const txt = el('text', { x: 0, y: -22, fill: txtCol, 'font-size': '12', 'font-family': 'monospace', 'text-anchor': 'middle', 'font-weight': 'bold' });
    txt.textContent = textList;
    group.appendChild(txt);

    bubblesLayer.appendChild(group);
    return {
        group,
        setText: (newTxt) => txt.textContent = newTxt
    };
}


// --- DOC ITEMS ---
const mainDoc = drawDocument(LOCS.inbox.x, LOCS.inbox.y);
itemsLayer.appendChild(mainDoc);

const piece1 = drawDocument(LOCS.extractor.x, LOCS.extractor.y, true);
const piece2 = drawDocument(LOCS.extractor.x, LOCS.extractor.y, true);
const piece3 = drawDocument(LOCS.extractor.x, LOCS.extractor.y, true);
gsap.set([piece1, piece2, piece3], { opacity: 0 });
itemsLayer.appendChild(piece1);
itemsLayer.appendChild(piece2);
itemsLayer.appendChild(piece3);

const finalDoc = drawDocument(LOCS.kitchenCenter.x, LOCS.kitchenCenter.y, false, true);
gsap.set(finalDoc, { opacity: 0 });
itemsLayer.appendChild(finalDoc);

// --- ANIMATION TIMELINE --- //
const tl = gsap.timeline({ repeat: -1, repeatDelay: 2, defaults: { ease: "power2.inOut" } });

function walkAnim(target, duration, vars) {
    const wl = gsap.timeline();
    wl.to(target, { duration: duration, ...vars }, 0);
    wl.to(target, { y: "-=5", yoyo: true, repeat: Math.max(1, Math.floor(duration * 6)), duration: 0.15 }, 0);
    return wl;
}

// 1. Orchestrator takes main doc to extractor
tl.add(createSpeechBubble(LOCS.inbox.x, LOCS.inbox.y - 30, "/rnr:process").group, 0)
    .to(bubblesLayer.lastChild, { opacity: 1, duration: 0.3 }, "+=0.2")
    .to(bubblesLayer.lastChild, { opacity: 0, duration: 0.3 }, "+=1.5");

tl.to(mainDoc, { y: "-=20", duration: 0.3 })
    .add(walkAnim(orchestrator, 2, { x: LOCS.extractor.x - 30, y: LOCS.extractor.y + 10 }))
    .to(mainDoc, { x: LOCS.extractor.x - 10, y: LOCS.extractor.y, duration: 2 }, "-=2");

// 2. Extractor breaks down
const exBubb = createSpeechBubble(LOCS.extractor.x + 40, LOCS.extractor.y - 10, "Extracting...", "terminal");
tl.to(exBubb.group, { opacity: 1, y: "-=10", duration: 0.3 })
    .to(extractor, { y: "-=5", yoyo: true, repeat: 5, duration: 0.1 }, "+=0")
    .to(mainDoc, { scale: 0, opacity: 0, duration: 0.2 })
    .to([piece1, piece2, piece3], { opacity: 1, x: LOCS.extractor.x - 10, y: LOCS.extractor.y + 10, duration: 0 })
    .to(piece1, { x: LOCS.extractor.x + 20, y: LOCS.extractor.y - 10, rotation: -15, duration: 0.4 }, "-=0.2")
    .to(piece2, { x: LOCS.extractor.x + 30, y: LOCS.extractor.y, rotation: 5, duration: 0.4 }, "-=0.4")
    .to(piece3, { x: LOCS.extractor.x + 40, y: LOCS.extractor.y - 10, rotation: 15, duration: 0.4 }, "-=0.4")
    .to(exBubb.group, { opacity: 0, duration: 0.2 }, "+=0.5");

// 3. Orchestrator distributes
tl.to([piece1, piece2, piece3], {
    x: LOCS.extractor.x - 10, y: LOCS.extractor.y + 10, rotation: 0, duration: 0.3
})
    .add(walkAnim(orchestrator, 1.5, { x: LOCS.proc1.x - 30, y: LOCS.proc1.y + 10 }))
    .to([piece1, piece2, piece3], { x: LOCS.proc1.x - 20, y: LOCS.proc1.y + 10, duration: 1.5 }, "-=1.5")
    .to(piece1, { x: LOCS.proc1.x + 20, y: LOCS.proc1.y - 10, duration: 0.3 })

    .add(walkAnim(orchestrator, 1.5, { x: LOCS.proc2.x + 30, y: LOCS.proc2.y - 10 }))
    .to([piece2, piece3], { x: LOCS.proc2.x + 40, y: LOCS.proc2.y - 10, duration: 1.5 }, "-=1.5")
    .to(piece2, { x: LOCS.proc2.x - 20, y: LOCS.proc2.y + 10, duration: 0.3 })
    .to(piece3, { x: LOCS.proc2.x - 10, y: LOCS.proc2.y + 15, duration: 0.3 });

// 4. Processing
const p1c = document.getElementById('screen-rnr-proc-1');
const p2c = document.getElementById('screen-rnr-proc-2');

tl.to(proc1, { x: "+=5", yoyo: true, repeat: 10, duration: 0.1 })
    .to(p1c, { fill: '#10b981', yoyo: true, repeat: 5, duration: 0.2 }, "-=1")
    .to(piece1, { filter: 'hue-rotate(90deg)', duration: 0.5 });

// Proc 2 encounters vague comment
const p2Bubb = createSpeechBubble(LOCS.proc2.x - 40, LOCS.proc2.y - 10, "Ambiguous...", "alert");
tl.to(proc2, { x: "+=5", yoyo: true, repeat: 4, duration: 0.1 })
    .to(p2c, { fill: '#ef4444', duration: 0 })
    .to(p2Bubb.group, { opacity: 1, duration: 0.3 })
    .to(proc2, { x: "-=5", yoyo: true, repeat: 1, duration: 0.1 }, "+=0.3");

// Clarifier
const clBubb = createSpeechBubble(LOCS.clarifier.x, LOCS.clarifier.y, "Asking user...", "terminal");
tl.to(clBubb.group, { opacity: 1, y: "-=10", duration: 0.3 })
    .to(clarifier, { y: "-=5", yoyo: true, repeat: 4, duration: 0.1 });

// User responds (from Orchestrator in kitchen maybe?)
// Let Orchestrator walk to kitchen while Proc2 is blocked
tl.add(walkAnim(orchestrator, 2.5, { x: LOCS.kitchenCenter.x - 30, y: LOCS.kitchenCenter.y + 20 }), "-=2.5");

const usBubb = createSpeechBubble(LOCS.kitchenCenter.x - 30, LOCS.kitchenCenter.y, "Accept change.", "think");
tl.to(usBubb.group, { opacity: 1, y: "-=10", duration: 0.3 })
    .to([usBubb.group, clBubb.group], { opacity: 0, duration: 0.3 }, "+=1");

// Proc 2 finishes piece 2
tl.to(p2Bubb.group, { opacity: 0, duration: 0.2 })
    .to(p2c, { fill: '#10b981', duration: 0 })
    .to(proc2, { x: "+=5", yoyo: true, repeat: 6, duration: 0.1 })
    .to(piece2, { filter: 'hue-rotate(90deg)', duration: 0.5 });

// Proc 2 needs citation.
tl.call(() => p2Bubb.setText("Needs citation!"))
    .to(p2c, { fill: '#8b5cf6', duration: 0 })
    .to(p2Bubb.group, { opacity: 1, duration: 0.2 });

const reBubb = createSpeechBubble(LOCS.researcher.x, LOCS.researcher.y, "Querying...", "terminal");
tl.to(reBubb.group, { opacity: 1, y: "-=10", duration: 0.3 })
    .to(researcher, { y: "-=5", yoyo: true, repeat: 6, duration: 0.1 })
    .to(reBubb.group, { opacity: 0, duration: 0.3 }, "+=0.3");

// Proc 2 finishes piece 3
tl.to(p2Bubb.group, { opacity: 0, duration: 0.2 })
    .to(p2c, { fill: '#10b981', duration: 0 })
    .to(proc2, { x: "+=5", yoyo: true, repeat: 6, duration: 0.1 })
    .to(piece3, { filter: 'hue-rotate(90deg)', duration: 0.5 });

// 5. Orchestrator collects pieces
tl.add(walkAnim(orchestrator, 2.5, { x: LOCS.proc1.x - 30, y: LOCS.proc1.y + 10 }))
    .to(piece1, { x: LOCS.proc1.x - 20, y: LOCS.proc1.y + 20, duration: 0.3 })
    .add(walkAnim(orchestrator, 1.5, { x: LOCS.proc2.x + 30, y: LOCS.proc2.y - 10 }))
    .to(piece1, { x: LOCS.proc2.x + 40, y: LOCS.proc2.y - 10, duration: 1.5 }, "-=1.5")
    .to([piece2, piece3], { x: LOCS.proc2.x + 40, y: LOCS.proc2.y - 10, duration: 0.3 })

    // go to assembler
    .add(walkAnim(orchestrator, 1, { x: LOCS.assembler.x + 30, y: LOCS.assembler.y - 10 }))
    .to([piece1, piece2, piece3], { x: LOCS.assembler.x + 40, y: LOCS.assembler.y - 10, duration: 1 }, "-=1")

    // drop pieces
    .to(piece1, { x: LOCS.assembler.x - 20, y: LOCS.assembler.y + 10, duration: 0.3 })
    .to(piece2, { x: LOCS.assembler.x - 10, y: LOCS.assembler.y + 15, duration: 0.3 }, "-=0.2")
    .to(piece3, { x: LOCS.assembler.x + 0, y: LOCS.assembler.y + 20, duration: 0.3 }, "-=0.2");

// 6. Assembler works
const asBubb = createSpeechBubble(LOCS.assembler.x - 40, LOCS.assembler.y, "Packing .docx", "terminal");
tl.to(asBubb.group, { opacity: 1, y: "-=10", duration: 0.3 })
    .to(assembler, { x: "+=5", yoyo: true, repeat: 5, duration: 0.1 })
    .to([piece1, piece2, piece3], { opacity: 0, scale: 0, duration: 0.3 }, "-=0.3")
    .to(finalDoc, { x: LOCS.assembler.x - 10, y: LOCS.assembler.y + 15, duration: 0 })
    .to(finalDoc, { opacity: 1, scale: 1, duration: 0.3 })
    .to(asBubb.group, { opacity: 0, duration: 0.3 }, "+=0.3");

// 7. Orchestrator takes it to outbox (kitchen area for visual effect)
tl.to(finalDoc, { x: LOCS.assembler.x + 30, y: LOCS.assembler.y - 10, duration: 0.3 })
    .add(walkAnim(orchestrator, 2, { x: LOCS.kitchenCenter.x - 20, y: LOCS.kitchenCenter.y + 10 }))
    .to(finalDoc, { x: LOCS.kitchenCenter.x - 10, y: LOCS.kitchenCenter.y + 10, duration: 2 }, "-=2")

    // Celebration
    .to(orchestrator, { y: "-=20", yoyo: true, repeat: 3, duration: 0.2 });

// Reset loop
tl.to([p1c, p2c], { fill: '#1e293b', duration: 0.5 })
    .to(finalDoc, { opacity: 0, duration: 0.5 })
    .to(mainDoc, { scale: 1, opacity: 1, x: LOCS.inbox.x, y: LOCS.inbox.y, duration: 0 })
    .add(walkAnim(orchestrator, 3, { x: LOCS.inbox.x, y: LOCS.inbox.y }));

