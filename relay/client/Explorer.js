function FileExplorer(manager, desktop) {
    this.new = () => {
        let exInt = new manager.Interface();
        exInt.onConnect(() => {
            exInt.run("ls -p").then((a) => {
                a = a
                    .trim()
                    .replace(/\t+|\n+|\r+/g, " ")
                    .replace(/\s+/g, " ")
                    .split(" ")
                    .filter((e) => e.length != 0);
                let e = new Explorer(a);
                e.open((name) => {
                    return new Promise((resolve, reject) => {
                        exInt.run(`cd ${name} && ls -p`).then((a) => {
                            resolve(
                                a
                                    .trim()
                                    .replace(/\t+|\n+|\r+/g, " ")
                                    .replace(/\s+/g, " ")
                                    .split(" ")
                                    .filter((e) => e.length != 0)
                            );
                        });
                    });
                });
                e.read((name) => {
                    return new Promise((resolve, reject) => {
                        exInt.run(`cat ${name}`).then(resolve);
                    });
                });
                e.on("file", (text, name) => {
                    let holder = document.createElement("div");
                    holder.innerText = text;
                    holder.style.background = "#fff";
                    holder.style.width = "100%";
                    holder.style.height = "100%";
                    holder.style.overflowWrap = "break-word";
                    holder.style.overflowY = "auto";
                    let dt = new desktop.new(holder);
                    dt.title(name);
                });
                desktop.new(e.container, "fileExplorer");
            });
        });
    };
}

class Explorer {
    #call(event, ...args) {
        if (this.events[event]) {
            for (let i = 0; i < this.events[event].length; i++) {
                this.events[event][i](...args);
            }
        }
    }
    constructor(items) {
        this.history = [];
        this.future = [];
        this.fileHandler;
        this.dirHandler;

        this.container = document.createElement("div");
        this.container.className = "explorer";
        this.container.style.position = "relative";
        this.container.style.width = "100%";
        this.container.style.height = "100%";
        this.container.style.overflowY = "auto";

        this.contents = document.createElement("div");
        this.contents.className = "files";
        this.contents.style.position = "absolute";
        this.contents.style.top = "30px";
        this.contents.style.left = "0";
        this.contents.style.zIndex = "2";
        this.container.appendChild(this.contents);

        this.navBar = document.createElement("div");
        this.navBar.style.position = "absolute";
        this.navBar.style.top = "0";
        this.navBar.style.left = "0";
        this.navBar.style.zIndex = "2";
        this.navBar.style.width = "100%";
        this.navBar.style.height = "30px";
        this.navBar.style.display = "flex";

        let navBack = document.createElement("div");
        navBack.className = "back";
        navBack.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M13.293 6.293 7.586 12l5.707 5.707 1.414-1.414L10.414 12l4.293-4.293z"></path></svg>`;
        let navForward = document.createElement("div");
        navForward.className = "forward";
        navForward.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M10.707 17.707 16.414 12l-5.707-5.707-1.414 1.414L13.586 12l-4.293 4.293z"></path></svg>`;
        navBack.addEventListener("click", async () => {
            this.future.push(this.history.pop());
            let paths = await this.dirHandler("../");
            this.render(paths);
        });
        navForward.addEventListener("click", async () => {
            let next = this.future.pop();
            this.history.push(next);
            let paths = await this.dirHandler(next);
            this.render(paths);
        });

        this.navBar.appendChild(navBack);
        this.navBar.appendChild(navForward);
        this.container.appendChild(this.navBar);

        this.fileUpload = document.createElement("input");
        this.fileUpload.type = "file";
        this.fileUpload.id = "fileUpload";
        this.fileUpload.style.display = "none";
        this.container.appendChild(this.fileUpload);

        const label = document.createElement("label");
        label.htmlFor = "fileUpload";
        label.style.width = "100%";
        label.style.height = "100%";
        label.style.display = "block";
        label.style.position = "absolute";
        label.style.top = "0";
        label.style.left = "0";
        this.container.appendChild(label);

        this.events = {};
        this.render(items);
    }

    render(items) {
        this.contents.innerHTML = "";
        const explorer = this;
        console.log(items);
        if (items.length == 0) {
            let div = document.createElement("div");
            div.textContent = "No files found";
            div.style.fontFamily = "monospace";
            this.contents.appendChild(div);
            return;
        }
        for (const item of items) {
            const div = document.createElement("div");
            const isFolder = item.at(-1) == "/";

            const icon = document.createElement("div");
            icon.classList.add("icon");
            if (isFolder) {
                icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M20 5h-9.586L8.707 3.293A.997.997 0 0 0 8 3H4c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V7c0-1.103-.897-2-2-2z"></path></svg>`;
            } else {
                icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6zm8 7h-1V4l5 5h-4z"></path></svg>`;
            }

            div.appendChild(icon);

            const text = document.createElement("div");
            text.className = "text";
            text.textContent = item;
            div.appendChild(text);

            if (isFolder) {
                div.classList.add("folder");
                div.addEventListener("click", async () => {
                    // `cd ${name} && ls -p`
                    this.history.push(item);
                    let paths = await explorer.dirHandler(item);
                    explorer.render(paths);
                });
            } else {
                div.classList.add("file");
                div.addEventListener("click", async () => {
                    let data = await explorer.fileHandler(item);
                    explorer.#call("file", data, item);
                });
            }

            this.contents.appendChild(div);

            if (isFolder) {
                div.style.fontWeight = "bold";
            }
        }
    }

    open(promise) {
        this.dirHandler = promise;
    }

    read(promise) {
        this.fileHandler = promise;
    }

    on(event, cb) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(cb);
    }
}
