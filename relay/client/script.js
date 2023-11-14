import { FlowLayer } from "./FlowLayer.js";
import { Folder } from "./explorer/Folder.js";
import { InputDialog } from "./login/InputDialog.js";
import { Editor } from "./editor/Editor.js";
import { TextEditor } from "./editor/TextEditor.js";
import { Desktop } from "./Desktop.js";
import { Term } from "./terminal/Term.js";

let main = document.querySelector("#main");
let desktop = new Desktop(main);

let ws = new WebSocket("ws://localhost:2134/wss");
const io = new FlowLayer(ws);

io.on("open", (socket) => {
    console.log(socket.id);
    let manager = new Term(socket);
    const inputDialog = new InputDialog();

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
        let folder = new Folder();
        console.log(folder);
        let folderC = socket.createChannel();
        folder.on("load", (data) => {
            console.log(data);
            folderC.emit("read", data);
        });

        folderC.on("read", (data) => {
            console.log(data);
            let view = new TextEditor();
            desktop.new(view.html, data.path);

            view.init();
            view.load(data.path.split(".").at(-1), data.data);
        });

        let c = socket.createChannel();
        c.emit("files");
        c.on("files", (files) => {
            folder.val("files", files);
        });
        desktop.new(folder.val("cont"));
    });

    document.querySelector("#newCode").addEventListener("click", () => {
        let editor = new Editor(desktop);
        let ch = socket.createChannel();
        editor.reader((file) => {
            return new Promise((resolve, reject) => {
                let ch2 = socket.createChannel();
                console.log(file);
                ch2.emit("read", file);
                ch2.on("read", ({ data }) => {
                    resolve(data);
                });
            });
        });
        ch.emit("dir", "/Users/masonwright/Desktop/term/relay");
        ch.on("dir", (data) => {
            editor.load(data);
            ch.close();
        });
        desktop.new(editor.html, "Editor");
    });
});
