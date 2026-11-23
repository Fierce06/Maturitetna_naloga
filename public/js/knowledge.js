const canvas = document.getElementById("networkOfKnowledge");
const ctx = canvas.getContext("2d");
const status = document.getElementById("knowledgeStatus");

let notes = [];
let connections = [];
let hoveredNodeId = null;

function validColor(color) {
    return /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#3b82f6";
}

function escapeCanvasText(value, maxLength = 18) {
    const text = String(value ?? "Untitled note").trim();
    return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function roundRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
}

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * scale);
    canvas.height = Math.round(rect.height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    generatePositions(rect.width, rect.height);
    draw();
}

function generatePositions(width, height) {
    if (!notes.length) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const radiusX = Math.max(130, width * 0.32);
    const radiusY = Math.max(120, height * 0.31);

    notes.forEach((note, index) => {
        const angle = notes.length === 1
            ? -Math.PI / 2
            : (index / notes.length) * Math.PI * 2 - Math.PI / 2;
        note.x = centerX + Math.cos(angle) * radiusX;
        note.y = centerY + Math.sin(angle) * radiusY;
    });
}

function draw() {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    connections.forEach(connection => {
        const source = notes.find(note => note.id === Number(connection.source_note_id));
        if (!source) return;

        String(connection.target_note_id || "")
            .split(",")
            .map(value => Number(value.trim()))
            .filter(Number.isInteger)
            .forEach(targetId => {
                const target = notes.find(note => note.id === targetId);
                if (!target) return;

                ctx.beginPath();
                ctx.moveTo(source.x, source.y);
                ctx.lineTo(target.x, target.y);
                ctx.strokeStyle = source.id === hoveredNodeId || target.id === hoveredNodeId
                    ? "#93b4ef"
                    : "#cbd5e1";
                ctx.stroke();
            });
    });
    ctx.restore();

    notes.forEach(note => {
        const color = validColor(note.subject_color);
        const width = 115;
        const height = 55;
        const x = note.x - width / 2;
        const y = note.y - height / 2;
        const hovered = note.id === hoveredNodeId;

        ctx.save();
        ctx.shadowColor = hovered ? "rgba(59,130,246,.22)" : "rgba(51,65,85,.12)";
        ctx.shadowBlur = hovered ? 18 : 10;
        ctx.shadowOffsetY = hovered ? 8 : 4;

        roundRect(x, y, width, height, 14);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.shadowColor = "transparent";

        ctx.strokeStyle = hovered ? color : "#e2e8f0";
        ctx.lineWidth = hovered ? 2 : 1;
        ctx.stroke();

        roundRect(x, y, 7, height, 14);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.fillStyle = "#0f172a";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.font = "700 12px Inter, sans-serif";
        ctx.fillText(escapeCanvasText(note.title), x + 20, y + 19);

        ctx.fillStyle = "#64748b";
        ctx.font = "600 9px Inter, sans-serif";
        ctx.fillText(escapeCanvasText(note.subject_name, 22), x + 20, y + 35);
        ctx.restore();
    });
}

function hitTest(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    return notes.find(note =>
        x >= note.x - 45 &&
        x <= note.x + 45 &&
        y >= note.y - 37 &&
        y <= note.y + 37
    ) || null;
}

canvas.addEventListener("mousemove", event => {
    const hit = hitTest(event.clientX, event.clientY);
    hoveredNodeId = hit ? hit.id : null;
    canvas.style.cursor = hit ? "pointer" : "default";
    draw();
});

canvas.addEventListener("mouseleave", () => {
    hoveredNodeId = null;
    draw();
});

canvas.addEventListener("click", event => {
    const hit = hitTest(event.clientX, event.clientY);
    if (hit) window.location.href = `/notebook?note=${hit.id}`;
});

async function loadKnowledgeGraph() {
    try {
        const [notesResponse, connectionsResponse] = await Promise.all([
            fetch("/api/notebook", { headers: { "Accept": "application/json" } }),
            fetch("/api/notebook/connections", { headers: { "Accept": "application/json" } })
        ]);

        if (!notesResponse.ok || !connectionsResponse.ok) throw new Error("Graph data could not be loaded.");

        const notesResult = await notesResponse.json();
        const connectionsResult = await connectionsResponse.json();

        notes = (notesResult.data || []).map(note => ({ ...note, id: Number(note.id) }));
        connections = connectionsResult.data || [];

        if (!notes.length) {
            status.textContent = "Create a note to start your knowledge graph.";
            status.classList.remove("hidden");
            return;
        }

        status.classList.add("hidden");
        resizeCanvas();
    } catch (error) {
        status.textContent = "The knowledge graph could not be loaded.";
        status.classList.remove("hidden");
    }
}

window.addEventListener("resize", resizeCanvas);
loadKnowledgeGraph();
