const canvas = document.getElementById("networkOfKnowledge");
const ctx = canvas.getContext("2d");


const nodes = [
    { name: "JavaScript", theme: "programming" },
    { name: "HTML",       theme: "programming" },
    { name: "CSS",        theme: "programming" },
    { name: "JavaScript", theme: "programming" },
    { name: "HTML",       theme: "programming" },
    { name: "CSS",        theme: "programming" },

    { name: "Physics",    theme: "science" },
    { name: "Gravity",    theme: "science" },
    { name: "Energy",     theme: "science" },

    { name: "Music",      theme: "art" },
    { name: "Painting",   theme: "art" }
];


function resizeCanvas() {

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    generatePositions();
    draw();
}


function generatePositions() {

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Size of the circle
    const radius = Math.min(
        canvas.width,
        canvas.height
    ) * 0.15;


    nodes.forEach((node, index) => {

        // Evenly distribute nodes around circle
        // with a little randomness
        const angle =
            (index / nodes.length) * Math.PI * 2
            + (Math.random() - 0.5) * 0.3;


        node.x =
            centerX +
            Math.cos(angle) * radius;


        node.y =
            centerY +
            Math.sin(angle) * radius;
    });
}



function draw() {

    // Clear canvas
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );



    for (let i = 0; i < nodes.length; i++) {

        for (let j = i + 1; j < nodes.length; j++) {

            const nodeA = nodes[i];
            const nodeB = nodes[j];


            // Connect nodes with same theme
            if (nodeA.theme === nodeB.theme) {

                ctx.beginPath();

                ctx.moveTo(
                    nodeA.x,
                    nodeA.y
                );

                ctx.lineTo(
                    nodeB.x,
                    nodeB.y
                );


                ctx.strokeStyle = "#cbd5e1";
                ctx.lineWidth = 2;

                ctx.stroke();
            }
        }
    }


    for (const node of nodes) {

        // Circle
        ctx.beginPath();

        ctx.arc(
            node.x,
            node.y,
            10,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#6366f1";

        ctx.fill();


        // Text
        ctx.fillStyle = "#334155";

        ctx.font = "14px sans-serif";

        ctx.textAlign = "center";

        ctx.fillText(
            node.name,
            node.x,
            node.y + 40
        );
    }
}


// ------------------------------------
// INITIALIZE
// ------------------------------------

window.addEventListener(
    "resize",
    resizeCanvas
);

resizeCanvas();