// const ctx = document.getElementById("systemChart").getContext("2d");
// const systemChart = new Chart(ctx, {
//     type: "line",
//     data: {
//         labels: [],
//         datasets: [
//             {
//                 label: "CPU Usage (%)",
//                 data: [],
//                 borderColor: "rgba(255, 99, 132, 1)",
//                 backgroundColor: "rgba(255, 99, 132, 0.2)",
//                 fill: true,
//             },
//             {
//                 label: "Memory Usage (%)",
//                 data: [],
//                 borderColor: "rgba(54, 162, 235, 1)",
//                 backgroundColor: "rgba(54, 162, 235, 0.2)",
//                 fill: true,
//             },
//         ],
//     },
//     options: {
//         responsive: true,
//         maintainAspectRatio: false,
//         scales: {
//             x: {
//                 type: "linear",
//                 position: "bottom",
//             },
//             y: {
//                 beginAtZero: true,
//                 max: 100,
//             },
//         },
//     },
// });

let windows = [];
let terminals = [];

const socket = new WebSocket(`wss://ws.lakefox.net/wss`);
let manager = new Term(socket);
// manager.connect(123)
// then let t = new manager.Terminal(el);
//  manager.run()
manager.on("open", () => {
    // let id = parseInt(prompt("enter id"));
    // manager.connect(id);
    newTerm();
});

document.querySelector("#new").addEventListener("click", () => {
    newTerm();
});

// manager.on("info", (data) => {
//     console.log("add");
//     systemChart.data.labels.push(new Date(data.timestamp).toLocaleTimeString());
//     systemChart.data.datasets[0].data.push(parseInt(data.cpuUsage.toFixed(2)));
//     systemChart.data.datasets[1].data.push(
//         parseInt(data.memoryUsage.toFixed(2))
//     );

//     // Limit the number of data points displayed
//     if (systemChart.data.labels.length > 100) {
//         systemChart.data.labels.shift();
//         systemChart.data.datasets[0].data.shift();
//         systemChart.data.datasets[1].data.shift();
//     }

//     // Update the chart
//     systemChart.update();
// });

function newTerm() {
    let main = document.querySelector("#main");
    let app = new DesktopWindow(main, `Terminal ${terminals.length}`, 100, 100);
    app.on("close", () => {
        const index = windows.indexOf(app);
        if (index !== -1) {
            windows.splice(index, 1);
        }
    });
    let t = new manager.Terminal(app.content);
    terminals.push(t);
    windows.push(app);
}
