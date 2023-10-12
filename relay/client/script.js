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
// manager.connect(123)
// then let t = new manager.Terminal(el);
//  manager.run()
manager.on("open", () => {
    // let id = parseInt(prompt("enter id"));
    // manager.connect(id);
    desktop.new();
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

function Desktop(main) {
    let windows = [];
    let terminals = [];
    let minimised = [];
    this.new = () => {
        let app = new DesktopWindow(
            main,
            `Terminal ${terminals.length}`,
            100 + windows.length * 40,
            100 + windows.length * 40
        );
        app.on("close", () => {
            const index = windows.indexOf(app);
            if (index !== -1) {
                windows.splice(index, 1);
            }
        });
        app.on("click", () => {
            bringToTop(windows, app);
        });
        app.on("minimise", () => {
            minimised.push(app);
            renderMinimised();
        });
        let t = new manager.Terminal(app.content);
        terminals.push(t);
        windows.push(app);
        bringToTop(windows, app);
    };
    this.open = (i) => {
        minimised[i].open();
        minimised.splice(i, 1);
    };
    function bringToTop(windows, app) {
        let base =
            windows.reduce(
                (maxZIndex, window) =>
                    Math.max(maxZIndex, getTopChild(window.window)[0][0]),
                0
            ) + 1;
        raise(app.window, base);
    }
    function getTopChild(win) {
        let sorted = [win, ...win.querySelectorAll("*")].sort(
            (a, b) =>
                parseInt(getComputedStyle(b).zIndex) ||
                0 - parseInt(getComputedStyle(a).zIndex) ||
                0
        );
        return sorted.map((e) => [
            parseInt(getComputedStyle(e).zIndex) || 0,
            e,
        ]);
    }

    function raise(win, base) {
        let indexes = getTopChild(win);
        let btm = indexes.at(-1)[0];
        let offset = Math.abs(base - btm) + 1;
        let children = [win, ...win.querySelectorAll("*")];
        for (let i = 0; i < indexes.length; i++) {
            if (indexes[i][0] != 0) {
                children[children.indexOf(indexes[i][1])].style.zIndex =
                    indexes[i][0] + offset;
            }
        }
    }

    function renderMinimised() {
        let tab = document.querySelector("#tabs");
        tab.innerHTML = "";
        for (let i = 0; i < minimised.length; i++) {
            const element = minimised[i];
            let div = document.createElement("div");
            div.className = "tab";
            div.innerHTML = element.title;
            div.addEventListener("click", () => {
                minimised[i].open();
                minimised.splice(i, 1);
                renderMinimised();
            });
            tab.appendChild(div);
        }
    }
}
