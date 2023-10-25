export class Auth {
    #call(event, ...args) {
        if (this.events[event]) {
            for (let i = 0; i < this.events[event].length; i++) {
                this.events[event][i](...args);
            }
        }
    }
    constructor(ws, master = false) {
        this.events = {};
        this.id;

        ws.addEventListener("open", () => {
            // Initiate the handshake
            // There should only ever be one connection on the websocket
            if (master) {
                send({ type: "connect" });
            }
            setInterval(() => {
                send("ping");
            }, 10000);
        });
        let connectionId = parseInt(Math.random() * 10000000);
        let handler = (raw) => {
            let data = JSON.parse(raw.data);
            if (data.type == "connect") {
                if (data.ident) {
                    // After you initiated the handshake they are asking you assign them an ID
                    send({
                        type: "id",
                        id: connectionId,
                    });
                } else {
                    // Someone else initiated the handshake
                    // Assign them an ID
                    send({
                        type: "id",
                        id: connectionId,
                    });
                    // Ask them to connect
                    send({ type: "connect", ident: true });
                }
            } else if (data.type == "id") {
                // All ID's are generated by the other system
                this.id = data.id;
                // Create the message handlers
                let socket = new Socket(ws, this.id, connectionId);
                // Name the connection with the ident if you initated or the connection ID
                // if they did
                this.#call("open", socket, this.id);
            }
        };
        ws.addEventListener("message", handler);

        ws.addEventListener("close", () => {
            this.#call("close");
        });
        let close = this.close;
        function send(data) {
            if (ws.readyState == 1) {
                ws.send(JSON.stringify(data));
            } else {
                close();
            }
        }

        let closed = false;
        this.close = () => {
            ws.addEventListener("message", handler);
            if (!closed) {
                closed = true;
                call("close");
            }
        };
    }
    on(event, cb) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(cb);
    }
}

function Socket(ws, id, connectId) {
    let events = {};
    let catchAll = () => {};
    let handler = (raw) => {
        let data = JSON.parse(raw.data);

        if (data.id == id && data.type == "data") {
            if (data.channel == undefined) {
                call(data.data.type, data.data.data);
            }
        } else if (
            data.id == id &&
            data.type == "open" &&
            data.channel !== undefined
        ) {
            console.log("creating channel");
            // Create channel
            let channel = new Channel(ws, id, connectId, data.channel);
            call("channel", channel);
        }
    };
    ws.addEventListener("message", handler);
    ws.addEventListener("close", () => {
        call("close");
    });

    function call(event, ...args) {
        if (events[event]) {
            for (let i = 0; i < events[event].length; i++) {
                events[event][i](...args);
            }
        } else {
            catchAll(event, ...args);
        }
    }
    this.on = (event, cb) => {
        if (!events[event]) {
            events[event] = [];
        }
        events[event].push(cb);
    };

    this.createChannel = () => {
        let channelId = parseInt(Math.random() * 10000000);
        if (ws.readyState == 1) {
            ws.send(
                JSON.stringify({
                    type: "open",
                    id: connectId,
                    channel: channelId,
                })
            );
        } else {
            this.close();
        }

        // Create channel
        let channel = new Channel(ws, id, connectId, channelId);
        return channel;
    };

    this.catch = (cA) => {
        catchAll = cA;
    };

    this.id = connectId;
    this.emit = (type, data) => {
        if (ws.readyState == 1) {
            ws.send(
                JSON.stringify({
                    type: "data",
                    id: connectId,
                    data: {
                        type,
                        data,
                    },
                })
            );
        } else {
            this.close();
        }
    };

    let closed = false;
    this.close = () => {
        ws.addEventListener("message", handler);
        if (!closed) {
            closed = true;
            call("close");
        }
    };
}

function Channel(ws, id, connectId, channel) {
    let events = {};
    let catchAll = () => {};
    function call(event, ...args) {
        if (events[event]) {
            for (let i = 0; i < events[event].length; i++) {
                events[event][i](...args);
            }
        } else {
            catchAll(event, ...args);
        }
    }

    let handler = (raw) => {
        let data = JSON.parse(raw.data);
        if (data.id == id && data.type == "data" && data.channel == channel) {
            call(data.data.type, data.data.data);
        }
    };
    ws.addEventListener("message", handler);
    ws.addEventListener("close", () => {
        call("close");
    });
    this.id = channel;
    this.emit = (type, data) => {
        if (ws.readyState == 1) {
            ws.send(
                JSON.stringify({
                    type: "data",
                    id: connectId,
                    channel,
                    data: {
                        type,
                        data,
                    },
                })
            );
        } else {
            this.close();
        }
    };
    let closed = false;
    this.close = () => {
        ws.addEventListener("message", handler);
        if (!closed) {
            closed = true;
            call("close");
        }
    };
    this.on = (event, cb) => {
        if (!events[event]) {
            events[event] = [];
        }
        events[event].push(cb);
    };
    this.catch = (cA) => {
        catchAll = cA;
    };
}

// let io = new Auth("url");

// io.on("open", (socket) => {
//     console.log("Connected");
//     socket.emit("hi", { data: "hi" });
//     socket.on("hi", ({ data }) => {
//         console.log(data);
//     });

//     let channel = socket.createChannel();

//     channel.emit("event", "message");

//     channel.on("event", (msg) => {
//         console.log(msg);
//     });

//     socket.on("close", ({ data }) => {
//         console.log(data.id, "has left");
//     });
// });
