class VSCodeLikeEditor {
    constructor(containerElement, fileStructure) {
        this.containerElement = containerElement;
        this.fileStructure = fileStructure;
        this.editor = null;

        this.initialize();
    }

    initialize() {
        this.createFileExplorer(this.containerElement, this.fileStructure);
        this.createEditor(this.containerElement);
    }

    createFileExplorer(container, files) {
        const fileExplorer = document.createElement("div");
        fileExplorer.classList.add("file-explorer");

        this.renderFileStructure(fileExplorer, files);

        container.appendChild(fileExplorer);
    }

    renderFileStructure(container, files) {
        for (const file of files) {
            const item = document.createElement("div");
            item.classList.add("file-item");

            if (file.type === "directory") {
                item.textContent = file.name;
                item.classList.add("directory");

                item.addEventListener("click", () => {
                    if (file.children) {
                        this.renderFileStructure(item, file.children);
                    }
                });
            } else if (file.type === "file") {
                item.textContent = file.name;
                item.classList.add("file");

                item.addEventListener("click", () => {
                    if (this.editor) {
                        this.loadFile(file.path);
                    }
                });
            }

            container.appendChild(item);
        }
    }

    createEditor(container) {
        require.config({
            paths: { vs: "https://unpkg.com/monaco-editor/min/vs" },
        });
        require(["vs/editor/editor.main"], () => {
            const editorContainer = document.createElement("div");
            editorContainer.classList.add("editor-container");

            const editorOptions = {
                value: "",
                language: "javascript",
            };

            this.editor = monaco.editor.create(editorContainer, editorOptions);
            window.onresize = function () {
                editor.layout();
            };

            container.appendChild(editorContainer);
        });
    }

    loadFile(filePath) {
        // Fetch the file content from the server using an API call
        // Update the Monaco Editor's content with the fetched file content
        // Example:
        // fetch(`/api/getFile?path=${filePath}`)
        //   .then((response) => response.text())
        //   .then((fileContent) => {
        //     this.editor.setValue(fileContent);
        //   });
    }

    saveFile(filePath, content) {
        // Send the modified content to the server to save it
        // Example:
        // fetch(`/api/saveFile?path=${filePath}`, {
        //   method: "POST",
        //   body: JSON.stringify({ content }),
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        // });
    }
}

// Usage
const fileStructure = [
    {
        name: "root",
        type: "directory",
        children: [
            { name: "file1.js", type: "file", path: "/path/to/file1.js" },
            {
                name: "folder1",
                type: "directory",
                children: [
                    {
                        name: "file2.js",
                        type: "file",
                        path: "/path/to/folder1/file2.js",
                    },
                ],
            },
        ],
    },
];
window.onload = () => {
    const editor = new VSCodeLikeEditor(
        document.getElementById("editorContainer"),
        fileStructure
    );
};
