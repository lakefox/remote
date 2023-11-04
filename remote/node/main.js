import * as os from "node:os";
import * as pty from "node-pty";
import "dotenv/config";
import "websocket-polyfill";
import fs from "fs";
import { Auth } from "../../relay/client/Auth.js";

// ./remote --org=automated --id=1

function main(args) {
    const ws = new WebSocket("wss://ws.lakefox.net/wss");
    let io = new Auth(ws);
    console.log("Socket is up and running...");

    io.on("open", (socket) => {
        console.log("Connected", io.id);
        socket.emit("ident", {
            org: args.org,
            id: args.id,
            ioID: io.id,
        });
        socket.on("channel", (channel) => {
            let session;
            console.log("Channel Created");

            channel.on("resize", (data) => {
                if (session) {
                    session.resize(data.cols, data.rows);
                }
            });

            channel.on("session", async () => {
                session = await createSession();
                session.onData((data) => {
                    channel.emit("response", { data });
                });
            });

            channel.on("command", async (data) => {
                console.log("COMMAND: ", data.data);
                if (session) {
                    session.write(data.data);
                }
            });

            channel.on("operation", async (data) => {
                if (data.write) {
                    console.log("WRITE: ", data.name);
                    fs.writeFile(data.name, data.data);
                } else if (data.read) {
                    console.log("READ: ", data.data);
                    fs.readFile(data.data, (err, file) => {
                        if (err) throw err;
                        channel.emit("operation", {
                            read: true,
                            name: data.data,
                            data: file,
                        });
                    });
                }
            });

            channel.on("close", () => {
                console.log("CLose");
                closed = true;
            });
        });

        socket.on("close", () => {
            console.log("Closed");
            main(args);
        });
    });
}
let args = {
    org: "automated",
    id: 44324,
};
console.log(args);
main(args);

async function createSession() {
    let shell;

    switch (os.platform()) {
        case "win32":
            shell = "powershell.exe";
            break;
        case "darwin":
            shell = "zsh";
            break;
        default:
            shell = "bash";
            break;
    }

    const ptyProcess = pty.spawn(shell, [], {
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        env: process.env,
    });
    ptyProcess.write("cd ~ && clear\n");
    return ptyProcess;
}
