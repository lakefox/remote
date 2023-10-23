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
import { Auth } from "./Auth.js";
let main = document.querySelector("#main");
let desktop = new Desktop(main);
let ws = new WebSocket("wss://ws.lakefox.net/wss");
const io = new Auth(ws);
io.on("open", (socket) => {
    let manager = new Term(socket);
    const inputDialog = new InputDialog();
    let explorer = new FileExplorer(manager, desktop);
    let codeEditor = new CodeEditor(manager, desktop);

    // Example usage
    inputDialog
        .promptUser("Enter device code:")
        .then((result) => {
            if (result) {
                let id = parseInt(result);
                console.log(id);
                // manager.connect(id);
                socket.emit("subscribe", { id });

                let t = new manager.Terminal();
                desktop.new(t);
            }
        })
        .catch((error) => {
            // alert(error);
        });

    document.querySelector("#newTerm").addEventListener("click", () => {
        let t = new manager.Terminal();
        console.log(t);
        desktop.new(t);
    });

    document.querySelector("#newExplorer").addEventListener("click", () => {
        explorer.new();
    });

    document.querySelector("#newCode").addEventListener("click", () => {
        codeEditor.new();
    });
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
