export let div = tempToDOM("div");
export let input = tempToDOM("input");
export let span = tempToDOM("span");
export let button = tempToDOM("button");

export let style = function () {
    let css = templateToString(...arguments);
    let newCSS = renameCSSClasses(css);
    let s = document.createElement("style");
    s.innerHTML = newCSS.modifiedCSS;
    document.head.appendChild(s);
    return newCSS.classMap;
};

function tempToDOM(type) {
    return function () {
        let el = document.createElement(type);
        let props = parseHTMLProperties(...arguments);
        for (let prop of Object.keys(props)) {
            console.log(prop, props[prop]);
            if (el[prop] !== undefined) {
                el[prop] = props[prop];
            } else {
                el.setAttribute(prop, props[prop]);
            }
        }
        return el;
    };
}
function parseHTMLProperties(template, ...values) {
    const properties = {};

    const templateString = template.reduce((acc, part, i) => {
        const value = values[i];
        if (typeof value === "string") {
            acc += part + value;
        } else {
            // If the value is not a string, treat it as a property name
            const propName = value;
            if (propName) {
                acc += part + `${propName}`;
            } else {
                acc += part;
            }
        }
        return acc;
    }, "");
    console.log(templateString);

    // Regular expression to match attribute="value" or attribute='value' or attribute
    const attributeRegex = /(\w+)(?:=(?:"([^"]*)"|'([^']*)'))?/g;

    templateString.replace(
        attributeRegex,
        (match, name, doubleQuotedValue, singleQuotedValue) => {
            const value = doubleQuotedValue || singleQuotedValue || true;
            properties[name] = value;
        }
    );

    return properties;
}

function templateToString(strings, ...values) {
    let result = "";
    for (let i = 0; i < strings.length; i++) {
        result += strings[i];
        if (i < values.length) {
            result += values[i];
        }
    }
    return result;
}

function generateRandomHash(length) {
    let result = "";
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * charactersLength)
        );
    }
    return result;
}

function renameCSSClasses(css) {
    const classMap = {};
    const cssWithModifiedClasses = css.replace(
        /\.([\w-]+)/g,
        (match, className) => {
            const randomHash = generateRandomHash(8);
            const modifiedClassName = `${className}-${randomHash}`;
            classMap[className] = modifiedClassName;
            return `.${modifiedClassName}`;
        }
    );

    return {
        modifiedCSS: cssWithModifiedClasses,
        classMap,
    };
}
