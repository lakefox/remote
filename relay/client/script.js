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

let main = document.querySelector("#main");
let desktop = new Desktop(main);
const socket = new WebSocket(`wss://ws.lakefox.net/wss`);
let manager = new Term(socket);
// Usage
const inputDialog = new InputDialog();
// manager.connect(123)
// then let t = new manager.Terminal(el);
//  manager.run()
manager.on("open", () => {
    // Example usage
    inputDialog
        .promptUser("Enter device code:")
        .then((result) => {
            if (result) {
                let id = parseInt(result);
                console.log(id);
                manager.connect(id);
                desktop.new();
            }
        })
        .catch((error) => {
            // alert(error);
        });
});

document.querySelector("#new").addEventListener("click", () => {
    desktop.new();
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
