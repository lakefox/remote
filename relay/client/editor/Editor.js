import { Fmt, State, div, input, style, ul } from "../html.js";
import { TextEditor } from "./TextEditor.js";

let { val, listen, f, Global } = new State();

export class Editor {
    constructor() {
        this.te = new TextEditor();
        let cont = div`class="${css.editor}"`;
        let teCont = div`class="${css.teCont}"`;
        let sidebar = div`class="${css.sidebar}"`;
        this.read = () => {
            return "";
        };
        let self = this;
        val("files", {});
        val("sidebar", sidebar);

        f(({ files, sidebar }) => {
            console.log(files);
            generateFileSelector(sidebar, files, self.read);
        });

        cont.appendChild(sidebar);
        teCont.appendChild(this.te.html);
        cont.appendChild(teCont);
        this.te.init();

        this.html = cont;
    }
    load(files) {
        val("files", convertToNestedObjectWithFiles(files));
    }
    reader(cb) {
        this.read = async (file) => {
            this.te.load(file.split(".").at(-1), await cb(file));
        };
    }
}

function generateFileSelector(container, structure, read, basePath = "") {
    const list = ul`class="${css.ul}"`;

    if (basePath == "") {
        list.style.marginLeft = "-20px";
    }

    for (const [name, content] of Object.entries(structure)) {
        const fullPath = basePath ? `${basePath}/${name}` : name;

        const listItem = document.createElement("li");

        if (Array.isArray(content)) {
            listItem.innerHTML += name;
            // Treat as a file
            listItem.classList.add(css.file);
            listItem.addEventListener("click", () => read(content[0]));
        } else if (typeof content === "object") {
            const arrow = document.createElement("span");
            arrow.classList.add(css.arrow);
            arrow.classList.add(css.open);
            listItem.appendChild(arrow);
            listItem.innerHTML += name;
            // Treat as a folder
            listItem.classList.add(css.folder);
            let h = (e) => {
                if (e.target.classList.contains(css.folder)) {
                    if (name == e.target.childNodes[1].nodeValue) {
                        toggleFolder(e.target);
                    }
                }
            };
            listItem.removeEventListener("click", h);
            listItem.addEventListener("click", h);
            generateFileSelector(listItem, content, read, fullPath);
        }

        list.appendChild(listItem);
    }

    container.appendChild(list);
}

function toggleFolder(folderElement) {
    folderElement.classList.toggle(css.open);
    const arrow = folderElement.querySelector("." + css.arrow);
    arrow.classList.toggle(css.open);

    // Toggle visibility of children only when clicking the folder icon
    const folderContent = folderElement.querySelector("ul");
    console.log(folderContent, folderContent.style.display);
    if (folderContent) {
        folderContent.style.display = arrow.classList.contains(css.open)
            ? "block"
            : "none";
    }
}

function findCommonPrefix(filePaths) {
    if (filePaths.length === 0) {
        return "";
    }

    const sortedPaths = filePaths.slice().sort();
    const firstPath = sortedPaths[0];
    const lastPath = sortedPaths[sortedPaths.length - 1];

    let i = 0;
    while (i < firstPath.length && firstPath[i] === lastPath[i]) {
        i++;
    }
    let preWLast = firstPath.substring(0, i);
    return preWLast.slice(0, preWLast.slice(0, -1).lastIndexOf("/"));
}

function convertToNestedObjectWithFiles(filePaths) {
    const commonPrefix = findCommonPrefix(filePaths);
    const result = {};

    for (const filePath of filePaths) {
        const parts = filePath
            .substring(commonPrefix.length)
            .split("/")
            .filter((part) => part !== "");

        let currentLevel = result;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            if (!currentLevel[part]) {
                if (i === parts.length - 1) {
                    currentLevel[part] = [];
                } else {
                    currentLevel[part] = {};
                }
            }

            if (i === parts.length - 1) {
                currentLevel[part].push(filePath);
            }

            currentLevel = currentLevel[part];
        }
    }

    return result;
}

let css = style`
    .editor {
        width: 100%;
        height: 100%;
        display: flex;
    }
    .teCont {
        width: calc(100% - 270px);
        height: 100%;
    }
    .sidebar {
        width: 250px;
        height: calc(100% - 23px);
        background: #161616;
        padding: 10px;
        overflow: auto;
        color: #d4d4d4;;
        font-family: Menlo, Monaco, "Courier New", monospace;
        font-weight: normal;
        font-size: 12px;
        font-feature-settings: "liga" 0, "calt" 0;
        font-variation-settings: normal;
        line-height: 18px;
        letter-spacing: 0px;
    }

    .ul {
        border-left: 1px solid #5c5c5c;
        padding-left: 34px;
    }

    .file {
        margin-left: -20px;
        cursor: pointer;
        list-style-type: none;
        color: #d4d4d4;
    }
    .folder {
        margin-left: -20px;
        cursor: pointer;
        list-style-type: none;
        color: #a6a6a6;
    }

    .arrow {
        display: inline-block;
        width: 0;
        height: 0;
        margin-right: 5px;
        border-style: solid;
        border-width: 5px 0 5px 8px;
        border-color: transparent transparent transparent #555;
    }

    .open {
        border-width: 8px 5px 0 5px;
        border-color: #555 transparent transparent transparent;
    }
`;
