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
    'e': '#10b981', // Extractor
    'p': '#f59e0b', // Processor
    'r': '#8b5cf6', // Researcher
    'c': '#ef4444', // Clarifier
    'a': '#ec4899', // Assembler
    'o': '#3b82f6', // Orchestrator
    'w': '#ffffff', // White
    'k': '#000000', // Black
    'd': '#1e1b4b', // Dark
    'g': '#94a3b8', // Grey
    's': '#ffcc80', // Skin
    't': '#0f172a', // Terminal background
    'x': null       // Transparent
};

// 16x16 pixel sprites
const spriteMap = {
    bot: [
        "xxxxxxxxxxxxxxxx",
        "xxxxxxxxxxxxxxxx",
        "xxxxxbbbbbbxxxxx",
        "xxxxbbbbbbbbxxxx",
        "xxxbbwkbwkwbbxxx",
        "xxxbbwwwwwwbbxxx",
        "xxxxbbbbbbbbxxxx",
        "xxxxxbbbbbbxxxxx",
        "xxxbb.bbbb.bbxxx",
        "xxbb..bbbb..bbxx",
        "xxbb..bbbb..bbxx",
        "xxxxxxbbbbxxxxxx",
        "xxxxxxbxxbxxxxxx",
        "xxxxxbbxxbbxxxxx",
        "xxxxxbbxxbbxxxxx",
        "xxxxxxxxxxxxxxxx"
    ]
};

function drawSprite(templateName, baseColor, x, y, scale = 3) {
    const group = el('g', { transform: `translate(${x}, ${y})` });
    const lines = spriteMap[templateName];

    // We color the dynamic 'b' pixels using baseColor
    lines.forEach((line, row) => {
        for (let col = 0; col < line.length; col++) {
            const char = line[col];
            if (char === 'x') continue;

            let fill = COLORS[char];
            if (char === 'b') fill = baseColor;

            const rect = el('rect', {
                x: col * scale,
                y: row * scale,
                width: scale * 1.05, // slight overlap to prevent bleeding in SVG rendering
                height: scale * 1.05,
                fill: fill,
                'shape-rendering': 'crispEdges'
            });
            group.appendChild(rect);
        }
    });
    return group;
}

// Function to draw a cubicle/desk
function drawDesk(x, y, labelText, colorCode) {
    const group = el('g', { transform: `translate(${x}, ${y})` });

    // Rug
    group.appendChild(el('rect', { x: -20, y: -20, width: 140, height: 100, fill: '#1e1b4b', rx: 10, opacity: 0.5 }));
    group.appendChild(el('rect', { x: -20, y: -20, width: 140, height: 100, fill: 'none', stroke: COLORS[colorCode], 'stroke-width': 2, 'stroke-dasharray': '5,5', rx: 10, opacity: 0.3 }));

    // Desk surface
    group.appendChild(el('rect', { x: 0, y: 15, width: 100, height: 35, fill: '#334155', rx: 4 }));
    group.appendChild(el('rect', { x: 0, y: 10, width: 100, height: 8, fill: '#475569', rx: 4 }));

    // Computer monitor
    group.appendChild(el('rect', { x: 30, y: -15, width: 40, height: 28, fill: '#0f172a', rx: 2 }));
    group.appendChild(el('rect', { x: 32, y: -13, width: 36, height: 24, fill: '#1e293b', rx: 1, class: 'screen', id: `screen-${labelText.replace(/\s+/g, '-')}` }));
    // Stand
    group.appendChild(el('rect', { x: 45, y: 13, width: 10, height: 10, fill: '#64748b' }));

    // Keyboard
    group.appendChild(el('rect', { x: 30, y: 30, width: 40, height: 10, fill: '#1e293b', rx: 2 }));

    // Label
    const text = el('text', { x: 50, y: 70, fill: '#94a3b8', 'font-size': '12', 'font-family': 'monospace', 'text-anchor': 'middle' });
    text.textContent = labelText;
    group.appendChild(text);

    return group;
}

// Draw Document Node
function drawDocument(x, y, isSmall = false, isGold = false) {
    const group = el('g', { transform: `translate(${x}, ${y})`, class: 'document' });
    const w = isSmall ? 25 : 40;
    const h = isSmall ? 35 : 56;

    const doc = el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: isGold ? '#fbbf24' : '#e2e8f0', rx: 3, filter: 'url(#drop-shadow)' });
    group.appendChild(doc);

    // lines
    const lineX = -w / 2 + 6;
    const lineW = w - 12;
    const lineC = isGold ? '#d97706' : '#94a3b8';
    for (let i = 0; i < (isSmall ? 3 : 5); i++) {
        group.appendChild(el('rect', { x: lineX, y: -h / 2 + 10 + i * 8, width: lineW * (i % 2 == 0 ? 1 : 0.7), height: 3, fill: lineC, rx: 1 }));
    }

    if (!isGold) {
        // Doc symbol
        const tag = el('rect', { x: -w / 2 + 4, y: -h / 2 + 4, width: w / 3, height: w / 3, fill: '#3b82f6', rx: 2 });
        group.appendChild(tag);
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


// --- SCENE SETUP --- //

// Map layout
const LOCS = {
    start: { x: 50, y: 150 },
    inbox: { x: 50, y: 150 },
    extractor: { x: 250, y: 100 },
    proc1: { x: 500, y: 200 },
    proc2: { x: 500, y: 350 },
    researcher: { x: 200, y: 350 },
    clarifier: { x: 200, y: 500 },
    assembler: { x: 750, y: 280 },
    outbox: { x: 900, y: 280 }, // output dock
};

// Draw Map
mapLayer.appendChild(drawDesk(LOCS.extractor.x, LOCS.extractor.y, 'rnr-extractor', 'e'));
mapLayer.appendChild(drawDesk(LOCS.proc1.x, LOCS.proc1.y, 'rnr-processor (1)', 'p'));
mapLayer.appendChild(drawDesk(LOCS.proc2.x, LOCS.proc2.y, 'rnr-processor (2)', 'p'));
mapLayer.appendChild(drawDesk(LOCS.researcher.x, LOCS.researcher.y, 'rnr-researcher', 'r'));
mapLayer.appendChild(drawDesk(LOCS.clarifier.x, LOCS.clarifier.y, 'rnr-clarifier', 'c'));
mapLayer.appendChild(drawDesk(LOCS.assembler.x, LOCS.assembler.y, 'rnr-assembler', 'a'));

// Draw Inbox/Outbox pedestals
mapLayer.appendChild(el('rect', { x: LOCS.inbox.x - 30, y: LOCS.inbox.y - 20, width: 60, height: 60, fill: '#1e293b', rx: 5, stroke: '#334155' }));
mapLayer.appendChild(el('text', { x: LOCS.inbox.x, y: LOCS.inbox.y + 55, fill: '#64748b', 'font-size': '10', 'text-anchor': 'middle' }).appendChild(document.createTextNode('INBOX')).parentNode);

mapLayer.appendChild(el('rect', { x: LOCS.outbox.x - 30, y: LOCS.outbox.y - 20, width: 60, height: 60, fill: '#1e293b', rx: 5, stroke: '#3b82f6', 'stroke-width': 2 }));
mapLayer.appendChild(el('text', { x: LOCS.outbox.x, y: LOCS.outbox.y + 55, fill: '#3b82f6', 'font-size': '10', 'text-anchor': 'middle', 'font-weight': 'bold' }).appendChild(document.createTextNode('FINAL.docx')).parentNode);

// Create Actors
const orchestrator = drawSprite('bot', COLORS['o'], LOCS.inbox.x, LOCS.inbox.y - 30);
actorsLayer.appendChild(orchestrator);

const extractor = drawSprite('bot', COLORS['e'], LOCS.extractor.x + 50, LOCS.extractor.y + 40);
actorsLayer.appendChild(extractor);

const proc1 = drawSprite('bot', COLORS['p'], LOCS.proc1.x + 50, LOCS.proc1.y + 40);
actorsLayer.appendChild(proc1);

const proc2 = drawSprite('bot', COLORS['p'], LOCS.proc2.x + 50, LOCS.proc2.y + 40);
actorsLayer.appendChild(proc2);

const researcher = drawSprite('bot', COLORS['r'], LOCS.researcher.x + 50, LOCS.researcher.y + 40);
actorsLayer.appendChild(researcher);

const clarifier = drawSprite('bot', COLORS['c'], LOCS.clarifier.x + 50, LOCS.clarifier.y + 40);
actorsLayer.appendChild(clarifier);

const assembler = drawSprite('bot', COLORS['a'], LOCS.assembler.x + 50, LOCS.assembler.y + 40);
actorsLayer.appendChild(assembler);


// Create Items
const mainDoc = drawDocument(LOCS.inbox.x, LOCS.inbox.y);
itemsLayer.appendChild(mainDoc);

// Three pieces created when Extractor acts
const piece1 = drawDocument(LOCS.extractor.x, LOCS.extractor.y, true);
const piece2 = drawDocument(LOCS.extractor.x, LOCS.extractor.y, true);
const piece3 = drawDocument(LOCS.extractor.x, LOCS.extractor.y, true);
gsap.set([piece1, piece2, piece3], { opacity: 0 });
itemsLayer.appendChild(piece1);
itemsLayer.appendChild(piece2);
itemsLayer.appendChild(piece3);

const finalDoc = drawDocument(LOCS.assembler.x, LOCS.assembler.y, false, true);
gsap.set(finalDoc, { opacity: 0 });
itemsLayer.appendChild(finalDoc);

// --- ANIMATION TIMELINE --- //

const tl = gsap.timeline({ repeat: -1, repeatDelay: 2, defaults: { ease: "power2.inOut" } });

// Utility to bounce character while walking
function walkAnim(target, duration, vars) {
    const wl = gsap.timeline();
    wl.to(target, { duration: duration, ...vars }, 0);
    wl.to(target, { y: "-=5", yoyo: true, repeat: Math.max(1, Math.floor(duration * 6)), duration: 0.15 }, 0);
    return wl;
}

// 1. Orchestrator picks up document
tl.add(createSpeechBubble(LOCS.inbox.x, LOCS.inbox.y - 50, "/rnr:process").group, 0)
    .to(bubblesLayer.lastChild, { opacity: 1, duration: 0.3 }, "+=0.2")
    .to(bubblesLayer.lastChild, { opacity: 0, duration: 0.3 }, "+=1.5");

tl.to(mainDoc, { y: LOCS.inbox.y - 30, duration: 0.3 })
    .add(walkAnim(orchestrator, 1.5, { x: LOCS.extractor.x + 20, y: LOCS.extractor.y + 10 }))
    .to(mainDoc, { x: LOCS.extractor.x, y: LOCS.extractor.y, duration: 1.5 }, "-=1.5"); // Carry doc

// 2. Extractor breaks down
const exBubb = createSpeechBubble(LOCS.extractor.x + 50, LOCS.extractor.y, "Extracting XML...", "terminal");
tl.to(exBubb.group, { opacity: 1, y: "-=10", duration: 0.3 })
    .to(extractor, { y: "-=10", yoyo: true, repeat: 5, duration: 0.1 }, "+=0")
    .to(mainDoc, { scale: 0, opacity: 0, duration: 0.2 })
    .to([piece1, piece2, piece3], { opacity: 1, duration: 0.2 })
    .to(piece1, { x: LOCS.extractor.x - 20, y: LOCS.extractor.y + 20, rotation: -15, duration: 0.4 }, "-=0.2")
    .to(piece2, { x: LOCS.extractor.x, y: LOCS.extractor.y + 30, rotation: 5, duration: 0.4 }, "-=0.4")
    .to(piece3, { x: LOCS.extractor.x + 20, y: LOCS.extractor.y + 20, rotation: 15, duration: 0.4 }, "-=0.4")
    .to(exBubb.group, { opacity: 0, duration: 0.2 }, "+=0.5");

// 3. Orchestrator takes pieces
tl.to([piece1, piece2, piece3], {
    x: LOCS.extractor.x + 20, y: LOCS.extractor.y - 10, rotation: 0, duration: 0.3
})
    .add(walkAnim(orchestrator, 1.2, { x: LOCS.proc1.x - 20, y: LOCS.proc1.y + 10 }))
    .to([piece1, piece2, piece3], { x: LOCS.proc1.x - 20, y: LOCS.proc1.y - 10, duration: 1.2 }, "-=1.2") // docs follow
    .to(piece1, { x: LOCS.proc1.x + 10, y: LOCS.proc1.y + 10, duration: 0.3 }) // Drop piece1 at proc1
    .add(walkAnim(orchestrator, 1, { x: LOCS.proc2.x - 20, y: LOCS.proc2.y + 10 }))
    .to([piece2, piece3], { x: LOCS.proc2.x - 20, y: LOCS.proc2.y - 10, duration: 1 }, "-=1") // docs follow
    .to(piece2, { x: LOCS.proc2.x + 10, y: LOCS.proc2.y + 10, duration: 0.3 }) // Drop piece2 at proc2
    .to(piece3, { x: LOCS.proc2.x + 20, y: LOCS.proc2.y + 15, duration: 0.3 }); // Drop piece3 at proc2

// 4. Processors working
const p1c = document.getElementById('screen-rnr-processor-(1)');
const p2c = document.getElementById('screen-rnr-processor-(2)');
const rec = document.getElementById('screen-rnr-researcher');

tl.to(proc1, { x: "+=5", yoyo: true, repeat: 10, duration: 0.1 })
    .to(p1c, { fill: '#10b981', yoyo: true, repeat: 5, duration: 0.2 }, "-=1")
    .to(piece1, { filter: 'hue-rotate(90deg)', duration: 0.5 }); // turn green

// Proc 2 encounters a vague comment -> Clarifier
const p2Bubb = createSpeechBubble(LOCS.proc2.x + 50, LOCS.proc2.y, "Ambiguous edit...", "alert");
tl.to(proc2, { x: "+=5", yoyo: true, repeat: 4, duration: 0.1 })
    .to(p2c, { fill: '#ef4444', duration: 0 })
    .to(p2Bubb.group, { opacity: 1, duration: 0.3 })
    .to(proc2, { x: "-=5", yoyo: true, repeat: 1, duration: 0.1 }, "+=0.3");

// Clarifier pops up
const clBubb = createSpeechBubble(LOCS.clarifier.x + 50, LOCS.clarifier.y, "Asking user...", "terminal");
tl.to(clBubb.group, { opacity: 1, y: "-=10", duration: 0.3 })
    .add(walkAnim(clarifier, 1, { x: LOCS.clarifier.x + 60, y: LOCS.clarifier.y - 50 })) // Steps forward

const usBubb = createSpeechBubble(LOCS.clarifier.x + 100, LOCS.clarifier.y - 80, "Accept change.", "think");
tl.to(usBubb.group, { opacity: 1, y: "-=10", duration: 0.3 }) // User responds
    .to([usBubb.group, clBubb.group], { opacity: 0, duration: 0.3 }, "+=1");

// Clarifier retreats
tl.add(walkAnim(clarifier, 1, { x: LOCS.clarifier.x + 50, y: LOCS.clarifier.y + 40 }));

// Proc 2 resumes piece 2
tl.to(p2Bubb.group, { opacity: 0, duration: 0.2 })
    .to(p2c, { fill: '#10b981', duration: 0 })
    .to(proc2, { x: "+=5", yoyo: true, repeat: 6, duration: 0.1 })
    .to(piece2, { filter: 'hue-rotate(90deg)', duration: 0.5 });

// Proc 2 encounters citation need -> Researcher
tl.call(() => p2Bubb.setText("Needs citation!"))
    .to(p2c, { fill: '#8b5cf6', duration: 0 })
    .to(p2Bubb.group, { opacity: 1, duration: 0.2 });

// Researcher works
const reBubb = createSpeechBubble(LOCS.researcher.x + 50, LOCS.researcher.y, "Query NotebookLM", "terminal");
tl.to(reBubb.group, { opacity: 1, y: "-=10", duration: 0.3 })
    .to(researcher, { x: "+=5", yoyo: true, repeat: 8, duration: 0.1 })
    .to(rec, { fill: '#8b5cf6', yoyo: true, repeat: 4, duration: 0.2 }, "-=0.8")
    .to(reBubb.group, { opacity: 0, duration: 0.3 }, "+=0.3");

// Proc 2 finishes piece 3
tl.to(p2Bubb.group, { opacity: 0, duration: 0.2 })
    .to(p2c, { fill: '#10b981', duration: 0 })
    .to(proc2, { x: "+=5", yoyo: true, repeat: 6, duration: 0.1 })
    .to(piece3, { filter: 'hue-rotate(90deg)', duration: 0.5 });

// 5. Orchestrator picks up all pieces and walks to Assembler
tl.add(walkAnim(orchestrator, 1, { x: LOCS.proc2.x - 20, y: LOCS.proc2.y - 10 }))
    .to([piece2, piece3], { x: LOCS.proc2.x - 20, y: LOCS.proc2.y - 30, duration: 0.3 })
    .add(walkAnim(orchestrator, 0.8, { x: LOCS.proc1.x - 20, y: LOCS.proc1.y - 10 }))
    .to([piece2, piece3], { x: LOCS.proc1.x - 20, y: LOCS.proc1.y - 30, duration: 0.8 }, "-=0.8") // Docs follow
    .to(piece1, { x: LOCS.proc1.x - 20, y: LOCS.proc1.y - 30, duration: 0.3 })

    .add(walkAnim(orchestrator, 1.5, { x: LOCS.assembler.x - 20, y: LOCS.assembler.y + 10 }))
    .to([piece1, piece2, piece3], { x: LOCS.assembler.x - 20, y: LOCS.assembler.y - 10, duration: 1.5 }, "-=1.5") // Docs follow

    // Drops pieces on assembler desk
    .to(piece1, { x: LOCS.assembler.x - 10, y: LOCS.assembler.y + 20, duration: 0.3 })
    .to(piece2, { x: LOCS.assembler.x + 10, y: LOCS.assembler.y + 10, duration: 0.3 }, "-=0.2")
    .to(piece3, { x: LOCS.assembler.x + 30, y: LOCS.assembler.y + 20, duration: 0.3 }, "-=0.2");

// 6. Assembler packages
const asBubb = createSpeechBubble(LOCS.assembler.x + 50, LOCS.assembler.y, "Packing .docx...", "terminal");
tl.to(asBubb.group, { opacity: 1, y: "-=10", duration: 0.3 })
    .to(assembler, { y: "-=10", yoyo: true, repeat: 5, duration: 0.1 })
    .to([piece1, piece2, piece3], { opacity: 0, scale: 0, x: LOCS.assembler.x + 10, y: LOCS.assembler.y, duration: 0.3 }, "-=0.3")
    .to(finalDoc, { opacity: 1, duration: 0.3 })
    .to(asBubb.group, { opacity: 0, duration: 0.3 }, "+=0.3");

// 7. Orchestrator takes Gold Doc to Outbox
tl.to(finalDoc, { x: LOCS.assembler.x - 20, y: LOCS.assembler.y - 10, duration: 0.3 })
    .add(walkAnim(orchestrator, 1.5, { x: LOCS.outbox.x - 20, y: LOCS.outbox.y }))
    .to(finalDoc, { x: LOCS.outbox.x - 20, y: LOCS.outbox.y - 20, duration: 1.5 }, "-=1.5") // Docs follow
    .to(finalDoc, { x: LOCS.outbox.x, y: LOCS.outbox.y, duration: 0.3 }) // Drop into outbox

    // Celebration jump
    .to(orchestrator, { y: "-=30", yoyo: true, repeat: 3, duration: 0.2 });

// Reset logic for looping happens automatically bc of GSAP, but need to reset some states visually
tl.to([p1c, p2c, rec], { fill: '#1e293b', duration: 0.5 }) // turn off screens
    .to(finalDoc, { opacity: 0, duration: 0.5 })
    .to(mainDoc, { scale: 1, opacity: 1, x: LOCS.inbox.x, y: LOCS.inbox.y, duration: 0 })
    .add(walkAnim(orchestrator, 2, { x: LOCS.inbox.x, y: LOCS.inbox.y - 30 }));
