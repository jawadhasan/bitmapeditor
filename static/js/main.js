window.onload = () => {
    const editor = new Editor({
        canvas: document.getElementById("editor"),
        canvasHeight: 280,
        canvasWidth: 280,
        height: 32,
        width: 32
    });
    document.getElementById("pencil_mode_button").addEventListener("click", (event) => {
        event.preventDefault();
        editor.pencilMode();
    });
    document.getElementById("eraser_mode_button").addEventListener("click", (event) => {
        event.preventDefault();
        editor.eraserMode();
    });
    document.getElementById("selection_mode_button").addEventListener("click", (event) => {
        event.preventDefault();
        editor.selectionMode();
    });
    document.getElementById("save_file_button").addEventListener("click", (event) => {
        event.preventDefault();
        const filename = document.getElementById("filename_input").value;
        editor.saveToFile(filename);
    });
    document.getElementById("open_file_button").addEventListener("drop", (event) => {
        event.preventDefault();
        const dataTransfer = event.dataTransfer;
        if (dataTransfer.items.length > 1) {
            alert("One file only!");
            return;
        }
        if (dataTransfer.items) {
            for (const item of dataTransfer.items) {
                const file = item.getAsFile();
                const fileReader = new FileReader();
                fileReader.addEventListener("loadend", () => {
                    const data = new Uint8Array(fileReader.result);
                    if (BMPTools.isPossiblyBMPFormat(data)) {
                        const bittMappData = BMPTools.extractBitmap(data);
                        const pixelWidth = bittMappData.width;
                        const pixelHeight = bittMappData.height;
                        editor.loadFromData(bittMappData.data, pixelWidth, pixelHeight);
                    }
                    else {
                        const pixelWidth = parseInt(document.getElementById("open_file_pixelwidth_input").value, 10);
                        const pixelHeight = parseInt(document.getElementById("open_file_pixelheight_input").value, 10);
                        editor.loadFromData(data, pixelWidth, pixelHeight);
                    }
                });
                fileReader.readAsArrayBuffer(file);
            }
        }
    });
    document.getElementById("open_file_button").addEventListener("dragover", (event) => {
        event.preventDefault();
    });
};
// const testData: Uint8Array = new Uint8Array([66, 77, 190, 0, 0, 0, 0, 0, 0, 0, 62, 0, 0, 0, 40, 0, 0, 0, 32, 0, 0, 0, 32, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 128, 0, 0, 0, 116, 18, 0, 0, 116, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 0, 0, 0, 15, 255, 255, 255, 247, 246, 142, 115, 183, 246, 181, 173, 183, 240, 141, 173, 183, 246, 181, 173, 183, 249, 142, 109, 23, 255, 255, 255, 247, 246, 141, 127, 247, 246, 189, 127, 247, 244, 138, 191, 247, 242, 186, 191, 247, 246, 138, 191, 247, 255, 255, 255, 247, 247, 139, 71, 247, 247, 187, 123, 247, 241, 184, 67, 247, 246, 187, 91, 247, 241, 188, 219, 247, 255, 255, 255, 247]);
