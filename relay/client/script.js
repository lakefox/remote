const ctx = document.getElementById("systemChart").getContext("2d");
const systemChart = new Chart(ctx, {
    type: "line",
    data: {
        labels: [],
        datasets: [
            {
                label: "CPU Usage (%)",
                data: [],
                borderColor: "rgba(255, 99, 132, 1)",
                backgroundColor: "rgba(255, 99, 132, 0.2)",
                fill: true,
            },
            {
                label: "Memory Usage (%)",
                data: [],
                borderColor: "rgba(54, 162, 235, 1)",
                backgroundColor: "rgba(54, 162, 235, 0.2)",
                fill: true,
            },
        ],
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                type: "linear",
                position: "bottom",
            },
            y: {
                beginAtZero: true,
                max: 100,
            },
        },
    },
});

let terminals = [];

const socket = new WebSocket(`wss://ws.lakefox.net/wss`);
let manager = new Term(socket);
// manager.connect(123)
// then let t = new manager.Terminal(el);
//  manager.run()
manager.on("open", () => {
    let id = parseInt(prompt("enter id"));
    manager.connect(id);
    newTerm();
});

manager.on("info", (data) => {
    console.log("add");
    systemChart.data.labels.push(new Date(data.timestamp).toLocaleTimeString());
    systemChart.data.datasets[0].data.push(parseInt(data.cpuUsage.toFixed(2)));
    systemChart.data.datasets[1].data.push(
        parseInt(data.memoryUsage.toFixed(2))
    );

    // Limit the number of data points displayed
    if (systemChart.data.labels.length > 100) {
        systemChart.data.labels.shift();
        systemChart.data.datasets[0].data.shift();
        systemChart.data.datasets[1].data.shift();
    }

    // Update the chart
    systemChart.update();
});

function newTerm() {
    let count = document.querySelector("#terms").childElementCount;

    let term = document.createElement("div");
    term.className = "terminalC";
    term.dataset.id = count;
    let t = new manager.Terminal(term);
    terminals.push(t);
    document.querySelector("#terms").appendChild(term);

    let html = ``;
    for (let i = 0; i < count + 1; i++) {
        html += `<div class="tab" onclick="tab(${i})" id="tab${i}">
                Tab ${i}
            </div>`;
    }

    html += `<div class="tab new" onclick="newTerm()">
                +
            </div>`;
    console.log(html);
    document.querySelector("#tabs").innerHTML = html;
    tab(count);
}

function tab(id) {
    let terms = document.querySelectorAll(".terminalC");
    document.querySelector("#tab" + id).classList.add("active");
    for (let i = 0; i < terms.length; i++) {
        console.log(
            id,
            parseInt(terms[i].dataset.id),
            parseInt(terms[i].dataset.id) == id
        );
        if (parseInt(terms[i].dataset.id) == id) {
            terms[i].style.display = "block";
        } else {
            terms[i].style.display = "none";
            if (document.querySelector("#tab" + i)) {
                document.querySelector("#tab" + i).classList.remove("active");
            }
        }
    }
    console.log(terminals);
}
