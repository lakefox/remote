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

let ws = new WebSocket("wss://ws.lakefox.net/wss");
// let ws = new WebSocket("ws://localhost:2134/wss");
const io = new FlowLayer(ws);
const inputDialog = new InputDialog();
let pannel = new Pannel();
console.log(pannel);
let clientID;

io.on("open", (socket) => {
    console.log(socket.id);
    let manager = new Term(socket);

    // Example usage
    if (!localStorage.token) {
        inputDialog
            .promptUser("Login/Create Account", [
                { placeholder: "Email", type: "email" },
                { placeholder: "Password", type: "password" },
            ])
            .then((creds) => {
                socket
                    .fetch("login", { email: creds[0], password: creds[1] })
                    .then((res) => {
                        console.log(res);
                        if (!res.error) {
                            clientID = res.id;
                            localStorage.setItem("token", res.token);
                            login();
                        } else {
                            socket
                                .fetch("create-account", {
                                    email: creds[0],
                                    password: creds[1],
                                })
                                .then((res) => {
                                    if (!res.error) {
                                        clientID = res.id;
                                        localStorage.setItem(
                                            "token",
                                            res.token
                                        );
                                        login();
                                    } else {
                                        window.location.reload();
                                    }
                                });
                        }
                    });
            });
    } else {
        socket.fetch("login", { token: localStorage.token }).then((res) => {
            if (!res.error) {
                clientID = res.id;
                localStorage.setItem("token", res.token);
                login();
            } else {
                localStorage.clear("token");
                window.location.reload();
            }
        });
    }

    function login() {
        socket.fetch("getPackages", 20).then((a) => {
            console.log(a);
            pannel.val("pkgs", a);
        });
        inputDialog
            .promptUser("", [
                { placeholder: "Enter device code", type: "text" },
            ])
            .then((result) => {
                if (result) {
                    let id = parseInt(result);
                    console.log(id);
                    // manager.connect(id);
                    socket.emit("subscribe", { org: "automated", id });
                    socket.fetch("addAction", 5).then(console.log);
                    let t = new manager.Terminal();
                    desktop.new(t);
                }
            });
    }

    document.querySelector("#newTerm").addEventListener("click", () => {
        let t = new manager.Terminal();
        desktop.new(t);
    });

    document.querySelector("#newPannel").addEventListener("click", () => {
        pannel.val("open", !pannel.val("open"));
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

    pannel.on("save", (pkg) => {
        pkg.author = clientID;
        socket.fetch("upload", pkg).then(() => {
            pannel.val("showNew", false);
        });
    });

    pannel.getEnv(async () => {
        return await socket.fetch("getENV");
    });

    document.querySelector("#newCode").addEventListener("click", () => {
        let editor = new Editor(desktop);
        editor.onSave((name, data) => {
            socket.fetch("write", { name, data });
        });
        editor.reader((file) => {
            return new Promise((resolve, reject) => {
                socket.fetch("read", file).then(({ data }) => {
                    resolve(data);
                });
            });
        });
        socket
            .fetch("dir", "/Users/masonwright/Desktop/current")
            .then((data) => {
                editor.load(data);
            });
        desktop.new(editor.html, "Editor");
    });
});
