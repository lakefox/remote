import { FlowLayer } from "./FlowLayer.js";
import { FileExplorer } from "./Explorer.js";
import { InputDialog } from "./InputDialog.js";
import { CodeEditor } from "./CodeEditor.js";
import { Desktop } from "./Desktop.js";
import { Term } from "./Term.js";

let main = document.querySelector("#main");
let desktop = new Desktop(main);
let ws = new WebSocket("ws://localhost:2134/wss");
const io = new FlowLayer(ws);

io.on("open", (socket) => {
    console.log(socket.id);
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
                socket.emit("subscribe", { org: "automated", id });

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
