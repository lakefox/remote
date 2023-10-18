function Term(socket) {
    let events = {};
    this.on = (name, cb) => {
        if (!events[name]) {
            events[name] = [];
        }
        events[name].push(cb);
    };
    socket.addEventListener("open", () => {
        emit("open");
    });

    let connectId = null;

    this.connect = (id) => {
        connectId = id;
        socket.send(JSON.stringify({ type: "subscribe", id }));
    };

    this.Terminal = function (el) {
        let id = null;
        let term = new window.Terminal({
            cursorBlink: true,
            convertEol: true,
            screenReaderMode: true,
            scrollback: 1000,
        });
        let fitAddon = new FitAddon.FitAddon();
        term.loadAddon(fitAddon);
        term.open(el);
        term.write(`Connected to: ${connectId}`);
        term.write(`\r`);
        term.onResize((evt) => {
            console.log(id, evt);
            if (id != undefined) {
                send({
                    type: "resize",
                    id,
                    data: evt,
                });
            }
        });

        // Initialize the ResizeObserver
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === el) {
                    // The terminal container has been resized
                    fitAddon.fit();
                }
            }
        });

        // Observe changes to the terminal container's size
        resizeObserver.observe(el);

        send({ type: "new" });

        term.onData((e) => {
            send({
                type: "command",
                id,
                data: e,
            });
        });
        function send(data) {
            socket.send(JSON.stringify({ type: "emit", id: connectId, data }));
        }
        socket.addEventListener("message", ({ data }) => {
            data = JSON.parse(data);
            if (data.type == "id" && id == null) {
                id = data.data;
            } else if (data.type == "response" && data.id == id) {
                term.write(data.data);
            } else {
                emit(data.type, data.data);
            }
        });
    };

    this.Interface = function () {
        let id = null;
        let cbs = [];
        let commandSent = false;
        send({ type: "new" });
        this.run = (command) => {
            commandSent = true;
            send({
                type: "command",
                id,
                data: command + "\n",
            });
            return new Promise((resolve) => {
                cbs.push(resolve);
            });
        };
        let collector = "";
        let collect = false;
        socket.addEventListener("message", ({ data }) => {
            data = JSON.parse(data);
            if (data.type == "id" && id == null) {
                id = data.data;
            } else if (
                data.type == "response" &&
                data.id == id &&
                commandSent
            ) {
                if (data.data.indexOf("[?2004") != -1) {
                    collect = true;
                } else if (data.data.indexOf("\x1B") != -1) {
                    cbs.shift()(collector);
                    collect = false;
                    commandSent = false;
                    collector = "";
                } else if (collect) {
                    collector += data.data;
                }
            }
        });
        function send(data) {
            socket.send(JSON.stringify({ type: "emit", id: connectId, data }));
        }
    };

    function emit(event, ...args) {
        if (events[event]) {
            for (let i = 0; i < events[event].length; i++) {
                events[event][i](...args);
            }
        }
    }
}

// let this handle the socket connection data
