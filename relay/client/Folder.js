import { div, Fmt, h2, State, style } from "./html.js";
// import { Search } from "../search/search.js";

export class Folder {
    constructor() {
        let { val, f } = new State();
        this.events = {};
        this.val = val;
        let self = this;
        let cont = div`id="folder" class="${css.row} scroll"`;
        val("cont", cont);
        val("files", []);
        val("history", []);
        val("fileObj", {});

        f(({ files }) => {
            let fileObj = convertToNestedObjectWithFiles(files);
            val({ fileObj, history: [Object.keys(fileObj)[0]] });
        });

        f(({ fileObj, history, files }) => {
            cont.innerHTML = "";

            // let search = new Search(cont);
            // search.on("open", (path) => {
            //     self.call("load", path);
            // });
            // search.val("files", files);

            let current = fileObj;
            for (let i = 0; i < history.length; i++) {
                current = current[history[i]];
            }
            let filesDiv = div`class="${css.files}"`;
            for (const key in current) {
                let value = current[key];
                if (Array.isArray(value)) {
                    // Files
                    for (let i = 0; i < value.length; i++) {
                        let name = value[i].split("/").at("-1");
                        let f = File(name, value[i]);
                        f.onclick = () => {
                            self.call("load", value[i]);
                        };
                        filesDiv.appendChild(f);
                    }
                } else {
                    filesDiv.appendChild(Folderr(this, key));
                }
            }
            let drive = Drive(
                this,
                Object.keys(fileObj)[0],
                filesDiv,
                history,
                self
            );
            cont.appendChild(drive);
            val({ cont });
        });
    }

    call(event, ...args) {
        if (this.events[event]) {
            for (let i = 0; i < this.events[event].length; i++) {
                this.events[event][i](...args);
            }
        }
    }
    on(event, cb) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(cb);
    }
}

function Drive(p, name, files, history, self) {
    let backIcon = div`class="${css.iconMain}"`;
    backIcon.innerHTML = icons.back;
    backIcon.onclick = () => {
        let history = p.val("history");
        history.pop();
        p.val({ history });
    };

    let icon = div`class="${css.iconMain} ${css.small}"`;
    icon.innerHTML = icons.drive;

    if (history.length > 1) {
        icon = backIcon;
    }

    return Fmt`${div`class="${css.drive}"`}
                    ${div`class="${css.row}"`}
                        ${icon}
                        ${h2`innerHTML="${history.join("/")}"`}
                    ${div`class="${css.row}"`}
                        ${files}`;
}

function File(name) {
    let icon = div`class="${css.icon}"`;
    icon.innerHTML = icons.file;
    let el = Fmt`${div`class="${css.folder}" title="${name}"`}
                    ${icon}
                    ${div`class="${css.filename}" innerHTML="${name}"`}`;
    return el;
}

function Folderr(p, name) {
    let icon = div`class="${css.icon}"`;
    icon.innerHTML = icons.folder;
    let el = Fmt`${div`class="${css.folder}"`}
                    ${icon}
                    ${div`class="${css.filename}" innerHTML="${name}"`}`;

    el.onclick = () => {
        let history = p.val("history");
        history.push(name);
        p.val({ history });
    };
    return el;
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

const icons = {
    file: `<svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
            >
                <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6zm8 7h-1V4l5 5h-4z" />
            </svg>`,
    folder: `<svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
            >
                <path d="M20 5h-9.586L8.707 3.293A.997.997 0 0 0 8 3H4c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V7c0-1.103-.897-2-2-2z" />
            </svg>`,
    back: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                    ><path d="M13.293 6.293 7.586 12l5.707 5.707 1.414-1.414L10.414 12l4.293-4.293z" /></svg
                >`,
    drive: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                    ><path
                        d="M20 13H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2zm-4 5h-2v-2h2v2zm4 0h-2v-2h2v2zm.775-7H21l-1.652-7.434A2 2 0 0 0 17.396 2H6.604a2 2 0 0 0-1.952 1.566L3 11h17.775z"
                    /></svg
                >`,
};

const css = style`
    #folder {
        color: aliceblue;
        padding: 0 20px;
        overflow-y: auto;
        background: #191721;
        height: 100%;
    }
    .icon > * {
		fill: #262835;
		width: 50px;
		height: 50px;
		text-align: center;
	}
	.filename {
		text-overflow: ellipsis;
		white-space: nowrap;
		overflow: hidden;
		width: 70px;
	}
	.icon {
		width: 100%;
		text-align: center;
	}
	.filename {
		text-overflow: ellipsis;
		white-space: nowrap;
		overflow: hidden;
		width: 100px;
		text-align: center;
	}
	.row {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
	}
	.folder {
		margin: 10px;
		cursor: pointer;
	}
    .files {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
	}
	.iconMain > * {
		fill: #939eff;
		width: 29px;
		height: 31px;
		text-align: center;
		background: #262835;
		margin-top: 17px;
		margin-right: 10px;
		border-radius: 8px;
		cursor: pointer;
	}
	.small > * {
		width: 17px;
		height: 19px;
		margin-top: 17px;
		padding: 6px;
	}
    .drive {
        font-family: sans-serif;
        color: #eeeeee;
        width: 700px;
    }
`;
