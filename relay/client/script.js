import { FlowLayer } from "./FlowLayer.js";
import { Folder } from "./explorer/Folder.js";
import { InputDialog } from "./login/InputDialog.js";
import { Editor } from "./editor/Editor.js";
import { TextEditor } from "./editor/TextEditor.js";
import { Desktop } from "./Desktop.js";
import { Term } from "./terminal/Term.js";
import { Pannel } from "./editor/Pannel.js";

let main = document.querySelector("#main");
let desktop = new Desktop(main);

let ws = new WebSocket("ws://localhost:2134/wss");
const io = new FlowLayer(ws);
let pannel = new Pannel();
pannel.val("open", false);
console.log(pannel);

io.on("open", (socket) => {
    console.log(socket.id);
    let manager = new Term(socket);
    const inputDialog = new InputDialog();

    // Example usage
    inputDialog
        .promptUser("Login", [
            { placeholder: "Enter device code", type: "text" },
            { placeholder: "Enter device code", type: "text" },
        ])
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
        let folder = new Folder();
        console.log(folder);

        folder.on("load", (data) => {
            console.log(data);
            socket.fetch("read", data).then((a) => {
                console.log(a);
                let view = new TextEditor();
                desktop.new(view.html, a.path);

                view.init();
                view.load(a.path.split(".").at(-1), a.data);
            });
        });

        socket.fetch("files").then((files) => {
            folder.val("files", files);
        });
        desktop.new(folder.val("cont"));
    });

    document.querySelector("#newCode").addEventListener("click", () => {
        let editor = new Editor(desktop);
        editor.reader((file) => {
            return new Promise((resolve, reject) => {
                socket.fetch("read", file).then(({ data }) => {
                    resolve(data);
                });
            });
        });
        socket
            .fetch("dir", "/Users/masonwright/Desktop/term/relay")
            .then((data) => {
                editor.load(data);
            });
        desktop.new(editor.html, "Editor");
    });
});
