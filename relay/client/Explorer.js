import { div, input, label, style } from "./html.js";

export function FileExplorer(manager, desktop) {
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
                    let holder = div`innerText="${text}" class="${css.holder}"`;
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

        this.container = div`class="${css.explorer} ${css.fileExplorer}" style="position: relative; width: 100%; height: 100%; overflow-y: auto;"`;
        this.contents = div`class="${css.files}" style="position: absolute; top: 30px; left: 0; z-index: 2;"`;
        this.container.appendChild(this.contents);

        this.navBar = div`class="${css.navBar}"`;

        let navBack = div`class="${css.back}" innerHTML='${backSvg}'`;
        let navForward = div`class="${css.forward}" innerHTML='${forwardSvg}'`;

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

        this.fileUpload = input`type="file" id="fileUpload" style="display: none;"`;
        this.container.appendChild(this.fileUpload);

        const labelComp = label`for="fileUpload" class="${css.label}"`;
        this.container.appendChild(labelComp);

        this.events = {};
        this.render(items);
    }

    render(items) {
        this.contents.innerHTML = "";
        const explorer = this;
        console.log(items);
        if (items.length == 0) {
            this.contents.appendChild(
                div`textContent="No files found" style="font-family: monospace;"`
            );
            return;
        }
        for (const item of items) {
            const iconDiv = div``;
            const isFolder = item.at(-1) == "/";

            const icon = div`class="${css.icon}"`;
            if (isFolder) {
                icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M20 5h-9.586L8.707 3.293A.997.997 0 0 0 8 3H4c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V7c0-1.103-.897-2-2-2z"></path></svg>`;
            } else {
                icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6zm8 7h-1V4l5 5h-4z"></path></svg>`;
            }

            iconDiv.appendChild(icon);
            iconDiv.appendChild(div`class="${css.text}" textContent="${item}"`);

            if (isFolder) {
                iconDiv.classList.add(css.folder);
                iconDiv.addEventListener("click", async () => {
                    // `cd ${name} && ls -p`
                    this.history.push(item);
                    let paths = await explorer.dirHandler(item);
                    explorer.render(paths);
                });
            } else {
                iconDiv.classList.add(css.file);
                iconDiv.addEventListener("click", async () => {
                    let data = await explorer.fileHandler(item);
                    explorer.#call("file", data, item);
                });
            }

            this.contents.appendChild(iconDiv);

            if (isFolder) {
                iconDiv.style.fontWeight = "bold";
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

let css = style`
.holder {
    background: #fff;
    width: 100%;
    height: 100%;
    overflow-wrap: break-word;
    overflow-y: auto;
}
.explorer {
    color: #fff;
    min-height: 390px;
}
.files {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    padding: 0 10px 10px 10px;
}
.navBar {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
    width: 100%;
    height: 30px;
    display: flex;
}
.file {
    width: 100px;
    height: 100px;
    text-align: center;
    cursor: pointer;
}

.folder {
    width: 100px;
    height: 100px;
    text-align: center;
}

.icon {
    width: 50px;
    height: 52px;
    margin: auto;
}

.text {
    font-family: sans-serif;
    color: #cccccc;
    overflow-wrap: break-word;
    padding: 10px;
}

.icon > svg {
    width: 50px;
    height: 50px;
    fill: #9e9e9e;
}

.forward > svg {
    height: 25px;
    fill: #cccccc;
}

.back > svg {
    height: 25px;
    fill: #cccccc;
}

.fileExplorer {
    background: #101010;
}
.label {
    width:100%;
    height:100%;
    display:block;
    position:absolute;
    top:0;
    left:0;
}
`;

let backSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M13.293 6.293 7.586 12l5.707 5.707 1.414-1.414L10.414 12l4.293-4.293z"></path></svg>`;
let forwardSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M10.707 17.707 16.414 12l-5.707-5.707-1.414 1.414L13.586 12l-4.293 4.293z"></path></svg>`;
