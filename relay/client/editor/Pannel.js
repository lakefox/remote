import {
    Fmt,
    State,
    div,
    input,
    style,
    h2,
    button,
    select,
    textarea,
    option,
    span,
    code,
    pre,
} from "../html.js";

let st = new State();
let { val, listen, f, Global } = st;

export class Pannel extends Global {
    constructor() {
        super();
        let self = this;
        let cont = div`class="${css.pannel}"`;
        val("cont", cont);
        val("open", false);
        val("showNew", false);
        val("showPkg", false);
        val("search", "");
        val("name", "");
        val("os", "Linux");
        val("author", "");
        val("description", "");
        val("install", "");
        val("start", "");
        val("status", "");
        val("script", "");
        val("varAmt", 3);
        val("varVals", []);
        val("pkgs", []);
        val("filterOs", "Linux");
        val("selectedPkg", 0);

        let newButton = button`class="${css.new}" textContent="NEW"`.on(
            "click",
            () => {
                val("showNew", !val("showNew"));
            }
        );

        let main = Fmt`${div``}
                            ${div`innerText="X" style="width: 100%;padding-right:10px;text-align:right;cursor:pointer;"`.on(
                                "click",
                                () => {
                                    val("open", false);
                                    val("showNew", false);
                                    val("showPkg", false);
                                }
                            )}
                            ${div`class="${css.searchBar}"`}  
                                ${input`type="search" name="search" placeholder="Find a package"`.bind(
                                    st,
                                    "search"
                                )}
                                ${div`class="${css.spread}"`}
                                    ${newButton}
                                    ${select`class="${css.input}"`.bind(
                                        st,
                                        "filterOs"
                                    )}
                                        ${option`value="MacOS" innerText="MacOs"`}
                                        ${option`value="Windows" innerText="Windows"`}
                                        ${option`value="Linux" innerText="Linux"`}
                            ${div``}
                                ${renderPkgs()}`;

        cont.appendChild(main);

        let newCont = Fmt`${div`class="${css.inputGroup}"`}
                                ${div`innerText="X" style="width: 100%;text-align:right;cursor:pointer;"`.on(
                                    "click",
                                    () => {
                                        val("showNew", false);
                                    }
                                )}
                                ${h2`innerText="Name"`}
                                ${input`class="${css.input}"`.bind(st, "name")}
                                ${h2`innerText="Supported OS's"`}
                                ${select`class="${css.input}"`.bind(st, "os")}
                                        ${option`value="MacOS" innerText="MacOs"`}
                                        ${option`value="Windows" innerText="Windows"`}
                                        ${option`value="Linux" innerText="Linux"`}
                                ${h2`innerText="Description"`}
                                ${textarea`class="${css.input}"`.bind(
                                    st,
                                    "description"
                                )}
                                ${h2`innerText="Variables"`}
                                ${genVarIO()}
                                ${div`class="${css.add}"`}
                                    ${button`innerText="+"`.on("click", () => {
                                        val("varAmt", val("varAmt") + 1);
                                    })}
                                ${h2`innerText="Install"`}
                                ${textarea`class="${css.input}"`.bind(
                                    st,
                                    "install"
                                )}
                                ${h2`innerText="Start"`}
                                ${textarea`class="${css.input}"`.bind(
                                    st,
                                    "start"
                                )}
                                ${h2`innerText="Status"`}
                                ${textarea`class="${css.input}"`.bind(
                                    st,
                                    "status"
                                )}
                                ${h2`innerText="Script"`}
                                ${textarea`class="${css.input}"`.bind(
                                    st,
                                    "script"
                                )}
                                ${div`class="${css.submit}" `}
                                    ${button`innerText="Save"`.on(
                                        "click",
                                        () => {
                                            savePackage(self);
                                        }
                                    )}`;

        let openedPkg = Fmt`${div`class="${css.inputGroup}"`}
                                ${div`innerText="X" style="width: 100%;text-align:right;cursor:pointer;"`.on(
                                    "click",
                                    () => {
                                        val("showPkg", false);
                                    }
                                )}
                                ${h2``.bind(st, "name")}
                                ${div`class="${css.spread}"`}
                                    ${div`class="${css.os}"`.bind(st, "author")}
                                    ${div`class="${css.os}"`.bind(st, "os")}
                                ${div``.bind(st, "description")}
                                ${h2`innerText="Install Script"`}
                                ${pre`class="${css.preCode}"`}
                                    ${code``.bind(st, "install")}
                                ${h2`innerText="Status Command"`}
                                ${pre`class="${css.preCode}"`}
                                    ${code``.bind(st, "status")}
                                ${h2`innerText="ENV Variables"`}
                                ${h2`innerText="Start Script"`}
                                ${pre`class="${css.preCode}"`}
                                    ${code``.bind(st, "start")}
                                ${h2`innerText="Source"`}
                                ${pre`class="${css.preCode}"`}
                                    ${code``.bind(st, "script")}
                                `;

        f(({ showNew }) => {
            cont.clear();
            val("name", "");
            val("os", "Linux");
            val("description", "");
            val("install", "");
            val("start", "");
            val("status", "");
            val("script", "");
            val("varAmt", 3);
            val("varVals", []);
            if (showNew) {
                cont.appendChild(newCont);
            } else {
                cont.appendChild(main);
            }
        });

        f(({ showPkg, selectedPkg, pkgs }) => {
            cont.clear();
            if (showPkg) {
                let p = pkgs[selectedPkg];
                val("name", p[1]);
                val("author", p[11]);
                val("os", p[3]);
                val("description", p[4]);
                val("vars", p[5]);
                val("install", p[6]);
                val("start", p[7]);
                val("status", p[8]);
                val("script", p[9]);
                cont.appendChild(openedPkg);
            } else {
                cont.appendChild(main);
            }
        });

        f(({ open }) => {
            if (open) {
                document.querySelector("#desktop").style.width =
                    "calc(100% - 700px)";
                document.querySelector("#pannel").style.width = "700px";
                document.querySelector("#pannel").style.display = "block";
            } else {
                document.querySelector("#desktop").style.width = "100%";
                document.querySelector("#pannel").style.display = "none";
            }
        });
        document.querySelector("#pannel").appendChild(cont);
    }
}

function genVarIO() {
    let c = div``;
    f(({ varAmt }) => {
        c.clear();
        let { varVals } = val();
        for (let i = 0; i < Math.max(varAmt, varVals.length); i++) {
            let v1K = "";
            let v1V = "";
            if (varVals[i]) {
                if (varVals[i].name != "") {
                    v1K = `value="${varVals[i].name || ""}"`;
                }
                if (varVals[i].value != "") {
                    v1V = `value="${varVals[i].value || ""}"`;
                }
            }
            let e = Fmt`${div`class="${css.varIO}"`}
                        ${input`class="${css.input}" type="text" placeholder="Name" ${v1K}`.on(
                            "input",
                            (e) => {
                                let v = val("varVals");
                                if (v[i] == undefined) {
                                    v[i] = { name: "", value: "" };
                                }
                                v[i].name = e.target.value;
                                val("varVals", v);
                            }
                        )}
                        ${span`innerText="="`}
                        ${input`class="${css.input}" type="text" placeholder="Default Value" ${v1V}`.on(
                            "input",
                            (e) => {
                                let v = val("varVals");
                                if (v[i] == undefined) {
                                    v[i] = { name: "", value: "" };
                                }
                                v[i].value = e.target.value;
                                val("varVals", v);
                            }
                        )}`;
            c.add(e);
        }
    });
    return c;
}

function savePackage(self) {
    let pkg = {
        name: val("name"),
        description: val("description"),
        systems: val("os"),
        install: val("install"),
        start: val("start"),
        status: val("status"),
        script: val("script"),
        variables: JSON.stringify(val("varVals")),
    };
    self.call("save", pkg);
}

function renderPkgs() {
    let c = div`class="${css.pkgCont}"`;
    f(({ pkgs, search, filterOs }) => {
        c.clear();
        for (let i = 0; i < pkgs.length; i++) {
            if (pkgs[i][3] != filterOs) {
                break;
            }
            if (
                (pkgs[i][1] + pkgs[i][4])
                    .toLowerCase()
                    .indexOf(search.toLowerCase()) != -1 ||
                search.trim() == ""
            ) {
                c.add(Fmt`${div`class="${css.pkg}"`.on("click", () => {
                    val({ showPkg: true, selectedPkg: i });
                })}
                            ${div`innerText="${pkgs[i][1]}" class="${css.title}"`}
                            ${div`innerText="${pkgs[i][3]}" class="${css.os}"`}
                            ${div`innerText="${pkgs[i][4]
                                .slice(0, 300)
                                .replace(/[^A-Za-z0-9\s]/g, "")}" class="${
                                css.desc
                            }"`}
                            `);
            }
        }
    });
    return c;
}

let css = style`
    .pannel {
        width: 100%;
        height: 100%;
        background: #0f0d15;
    }
    .searchBar {
        display: flex;
        background: #2d2a38;
        height: 150px;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    }
    .searchBar > input {
        width: 80%;
        height: 29px;
        border: none;
        border-radius: 5px;
        color: #000;
        padding-left: 10px;
    }
    .searchBar > div {
        width: 80%;
        margin-top: 10px;
        display: flex;
    }

    .new {
        background: #13111c;
        border: none;
        border-radius: 3px;
        padding: 5px 10px;
        color: #eee;
        font-weight: 500;
        width: 100px;
        height: 29px;
        cursor: pointer;
    }
    .inputGroup {
        color: aliceblue;
        font-family: sans-serif;
        overflow-y: auto;
        height: 100vh;
        padding: 20px;
    }
    .input {
        min-height: 22px;
        background: #353a5661;
        border: none;
        border-radius: 3px;
        color: #fff;
        font-size: 15px;
    }
    textarea.input {
        width: 100%;
        height: 300px
    }
    select.input {
        width: 300px;
    }
    input.input {
        width: 300px;
    }
    .submit {
        margin-bottom: 100px;
        display: flex;
        justify-content: flex-end;
        margin-top: 10px;
    }
    .submit > button {
        width: 100px;
        height: 31px;
        background: #d7d7d7;
        border: none;
        border-radius: 3px;
        font-weight: 600;
        cursor: pointer;
    }
    .varIO {
        display: flex;
        margin-bottom: 7px;
    }
    .varIO > * {
        height: 25px;
    }
    .varIO > span {
        width: 40px;
        text-align: center;
        font-size: 20px;
    }
    .add {
        width: 100%;
        display: flex;
        justify-content: flex-end;
        margin-top: 30px;
    }
    .add > button {
        width: 100px;
        height: 31px;
        background: #d7d7d7;
        border: none;
        border-radius: 3px;
        font-weight: 600;
        cursor: pointer;
    }
    .pkgCont {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: flex-start;
        margin: auto;
        margin-top: 50px;
        width: 600px;
    }
    .pkg {
        background: #2d2937;
        margin: 10px;
        width: 42%;
        height: 108px;
        font-size: 20px;
        font-family: sans-serif;
        border-radius: 4px;
        padding: 10px;
        color: aliceblue;
        font-weight: 600;
        cursor: pointer;
    }
    .spread {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
    }
    .preCode {
        background: #22222b;
        padding: 10px;
        border-radius: 4px;
        color: #9d9d9d;
    }
    .title {}
    .os {
        color: #ffffff3d;
        font-size: 12px;
        text-align: end;
        text-transform: uppercase;
        font-weight: 700;
        font-family: monospace;
    }
    .desc {
        font-size: 14px;
        color: #c7c7c7;
        font-weight: 400;
        height: 65px;
        overflow-y: clip;
    }
`;
