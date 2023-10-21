function CodeEditor(manager, desktop) {
    this.new = async (pwd = "") => {
        let exInt = new manager.Interface();
        exInt.onConnect(async () => {
            if (pwd != "") {
                await exInt.run(`cd ${pwd}`);
            }
            let base = await exInt.run(`pwd`);
            base = base.trim();
            console.log(base);
            exInt.run("ls -p -R").then((a) => {
                let files = fileParser(a, base);
                console.log(files);
                let editor = new Editor(base, files);
                let dt;
                editor.on("load", () => {
                    dt = new desktop.new(editor.html);
                    dt.title(base);
                });
                editor.on("open", async (path) => {
                    path = base + path.slice(path.indexOf("/", 1));
                    console.log(path);
                    dt.title(path);
                    let v = await exInt.run(`cat ${path}`);
                    editor.setValue(path, v);
                });
            });
        });
    };
}

class Editor {
    call(event, ...args) {
        console.log(this);
        if (this.events[event]) {
            for (let i = 0; i < this.events[event].length; i++) {
                this.events[event][i](...args);
            }
        }
    }
    constructor(base, files) {
        this.events = {};
        this.html = "";
        let script = document.createElement("script");
        script.src = `https://cdnjs.cloudflare.com/ajax/libs/ace/1.30.0/ace.min.js`;
        script.onload = () => {
            console.log("run");
            let container = document.createElement("div");
            container.style.display = "flex";
            container.style.height = "100%";

            let editor = document.createElement("div");
            editor.style.width = "100%";
            this.Ace = ace.edit(editor, {
                mode: "ace/mode/javascript",
                selectionStyle: "text",
            });

            this.Ace.setTheme("ace/theme/one_dark");
            container.appendChild(makeFiles(base, files, this));
            container.appendChild(editor);
            this.html = container;
            this.call("load");
        };
        if (
            [...document.head.children].find((e) => e.src == script.src) ==
            undefined
        ) {
            document.head.appendChild(script);
        } else {
            script.onload();
        }
    }
    setValue(name, value) {
        let ext = name.split(".").at(-1);
        console.log(ext);
        this.Ace.session.setMode(`ace/mode/${ext}`);
        this.Ace.session.setValue(value);
    }
    on(event, cb) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(cb);
    }
}

function makeFiles(base, files, context) {
    let div = document.createElement("div");
    div.className = "code";
    let rmAmt = files[0].path.lastIndexOf("/");
    for (let i = 0; i < files.length; i++) {
        files[i].path = files[i].path.slice(rmAmt);
        files[i].contents = files[i].contents.filter((e) => e.at(-1) != "/");
    }
    let nS = convertToNestedStructure(files);
    let html = createFileNavigator(div, nS, base, context);
    html.querySelector("ul").style.display = "block";
    return html;
}

function fileParser(text, base) {
    let split = text.split("\n");
    let sections = [];
    if (split[0] == ".:\r") {
        split.shift();
    }
    let last = 0;
    for (let i = 0; i < split.length; i++) {
        const element = split[i];
        if (element == "\r") {
            sections.push(clean(last, i));
            last = i + 1;
        }
    }
    sections.push(clean(last, split.length - 1));
    function clean(last, i) {
        let section = split.slice(last, i).join("").trim();
        let dirPath =
            base + section.slice(0, section.indexOf(":")).replace("./", "/");
        if (sections.length == 0) {
            dirPath = base;
            section = ":\r" + section;
        }
        section = section
            .slice(section.indexOf(":") + 2)
            .replace(/\t+|\n+|\r+/g, " ")
            .replace(/\s+/g, " ")
            .split(" ")
            .filter((e) => e.length != 0);
        return {
            path: dirPath,
            contents: section,
        };
    }
    return sections;
}

function createFileNavigator(parent, data, base, context) {
    console.log(data);
    const ul = document.createElement("ul");
    ul.className = "ul";
    parent.appendChild(ul);

    data.forEach((item) => {
        const li = document.createElement("li");
        ul.appendChild(li);

        if (
            typeof item === "object" &&
            item.contents &&
            item.contents.length > 0
        ) {
            const expander = document.createElement("span");
            expander.className = "expander";
            li.appendChild(expander);
            li.appendChild(document.createTextNode(getFolderName(item.path)));
            expander.addEventListener("click", () => {
                li.classList.toggle("expanded");
            });

            createFileNavigator(li, item.contents, item.path, context);
        } else {
            li.className = "fileTag";
            li.textContent = item;
            li.addEventListener("click", () => {
                console.log(base, item);
                context.call("open", base + "/" + item);
            });
        }
    });
    return parent;
}

function getFolderName(path) {
    // Extract the last part of the path as the folder name
    const parts = path.split("/");
    return parts[parts.length - 1];
}

function convertToNestedStructure(data) {
    const result = [];

    // Create a map to track folders by path
    const foldersMap = new Map();

    data.forEach((item) => {
        const pathParts = item.path.split("/").filter((part) => part !== "");
        let currentFolder = result;

        pathParts.forEach((part, index) => {
            if (!foldersMap.has(part)) {
                const folder = {
                    path: `/${pathParts.slice(0, index + 1).join("/")}`,
                    contents: [],
                };
                foldersMap.set(part, folder);
                currentFolder.push(folder);
            }
            currentFolder = foldersMap.get(part).contents;
        });

        if (typeof item.contents === "object" && item.contents.length > 0) {
            currentFolder.push(...item.contents);
        } else {
            currentFolder.push(item.contents);
        }
    });

    return result;
}
