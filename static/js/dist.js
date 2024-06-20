class LinkedNode {
    get next() {
        return this._next;
    }
    set next(node) {
        this._next = node;
        if (node.prev !== this) {
            node.prev = this;
        }
    }
    get prev() {
        return this._prev;
    }
    set prev(node) {
        this._prev = node;
        if (node.next !== this) {
            node.next = this;
        }
    }
}
class LinkedList {
    push(node) {
        if (!this._start) {
            this._start = node;
            this._end = node;
            return;
        }
        this._end.next = node;
        this._end = node;
    }
    pop() {
        if (!this._end) {
            return null;
        }
        const node = this._end;
        this._end = this._end.prev;
        return node;
    }
}
class ActionNode extends LinkedNode {
    constructor(undo, redo) {
        super();
        this.undo = undo;
        this.redo = redo;
    }
}
class ActionList extends LinkedList {
    push(node) {
        // super(node);
    }
}
class BMPTools {
    static extractBitmap(inputData) {
        const headerData = BMPTools.extractHeaderData(inputData);
        const pixelData = inputData.slice(headerData.pixelDataOffset, headerData.fileLength);
        const rowSize = (headerData.width - 1 - (headerData.width - 1) % 32 + 32) / 8;
        const outputData = new Uint8Array(Math.ceil((headerData.width * headerData.height) / 8));
        if (headerData.height > 0) {
            let bitCount = 0;
            for (let y = headerData.height - 1; y >= 0; y--) {
                const rowStart = rowSize * y;
                for (let x = 0; x < headerData.width; x++) {
                    const inputByte = Math.floor(x / 8);
                    const outputByte = Math.floor((((headerData.height - 1 - y) * headerData.width) + x) / 8);
                    const inputMask = 1 << (x % 8);
                    const val = Serialisers.reverseUint32BitOrder(~pixelData[rowStart + inputByte] & inputMask) >> 24;
                    outputData[outputByte] = val + outputData[outputByte];
                    bitCount++;
                }
            }
        }
        else {
            throw new Error("Cannot read bitmaps of inverted height");
        }
        return {
            data: outputData,
            height: headerData.height,
            width: headerData.width
        };
    }
    static extractHeaderData(inputData) {
        const headerData = {};
        if (inputData.length < 54) {
            throw new Error("Data not valid (Not long enough, must be at least 54 bytes)");
        }
        if (!(inputData[0] === 0x42 && inputData[1] === 0x4d)) {
            throw new Error("Data not valid (No BM header)");
        }
        headerData.fileLength = Serialisers.readUint32(inputData, 2, true);
        if (headerData.fileLength !== inputData.length) {
            throw new Error("Data not valid (Length incorrect)");
        }
        headerData.pixelDataOffset = Serialisers.readUint32(inputData, 10, true);
        headerData.headerLength = Serialisers.readUint32(inputData, 14, true);
        headerData.width = Serialisers.readUint32(inputData, 18, true);
        headerData.height = Serialisers.readInt32(inputData, 22, true);
        if (headerData.height <= 0) {
            throw new Error("Cannot read bitmaps of inverted height");
        }
        headerData.planes = Serialisers.readUint16(inputData, 26, true);
        if (headerData.planes !== 1) {
            throw new Error("Data not valid (Only one plane supported)");
        }
        headerData.bitsPerPixel = Serialisers.readUint16(inputData, 28, true);
        if (headerData.bitsPerPixel !== 1) {
            throw new Error("Data not valid (Only monochrome BMP data supported)");
        }
        headerData.compressed = Serialisers.readUint32(inputData, 30, true);
        if (headerData.compressed !== 0) {
            throw new Error("Data not valid (Only uncompressed data supported)");
        }
        headerData.imageSize = Serialisers.readUint32(inputData, 34, true);
        headerData.numberColors = Serialisers.readUint32(inputData, 46, true);
        headerData.importantColors = Serialisers.readUint32(inputData, 50, true);
        headerData.bytesRead = headerData.headerLength + 14;
        return headerData;
    }
    static isPossiblyBMPFormat(inputData) {
        if (inputData.length < 54) {
            return false;
        }
        if (!(inputData[0] === 0x42 && inputData[1] === 0x4d)) {
            return false;
        }
        const fileLen = Serialisers.readUint32(inputData, 2, true);
        if (fileLen !== inputData.length) {
            return false;
        }
        return true;
    }
}
var MouseButton;
(function (MouseButton) {
    MouseButton[MouseButton["LEFT"] = 0] = "LEFT";
    MouseButton[MouseButton["RIGHT"] = 2] = "RIGHT";
})(MouseButton || (MouseButton = {}));
var Mode;
(function (Mode) {
    Mode[Mode["PENCIL"] = 0] = "PENCIL";
    Mode[Mode["ERASER"] = 1] = "ERASER";
    Mode[Mode["SELECTION"] = 2] = "SELECTION";
})(Mode || (Mode = {}));
class Editor {
    constructor(options) {
        this._pixelWidth = 0;
        this._pixelHeight = 0;
        this._mouseDown = false;
        this._shiftDown = false;
        this._selectionStartX = 0;
        this._selectionStartY = 0;
        this._selectionEndX = 0;
        this._selectionEndY = 0;
        this._editorMode = Mode.PENCIL;
        options = options || {};
        if (options.canvas) {
            this.canvas = options.canvas;
        }
        else {
            throw new Error("BittMappEditor must be initialized with a canvas.");
        }
        if (options.canvasWidth) {
            this.canvasWidth = options.canvasWidth;
        }
        else {
            throw new Error("BittMappEditor must be constructed with a canvasWidth.");
        }
        if (options.canvasHeight) {
            this.canvasHeight = options.canvasHeight;
        }
        else {
            throw new Error("BittMappEditor must be constructed with a canvasHeight.");
        }
        if (options.width) {
            this._width = options.width;
        }
        else {
            throw new Error("BittMappEditor must be constructed with a width.");
        }
        if (options.height) {
            this._height = options.height;
        }
        else {
            throw new Error("BittMappEditor must be constructed with a height.");
        }
        this._context = this.canvas.getContext("2d");
        const deviceRatio = window.devicePixelRatio || 1;
        const backingStoreRatio = this._context.backingStorePixelRatio || 1;
        this._scale = deviceRatio / backingStoreRatio;
        this._deviceRatio = deviceRatio;
        this.canvas.width = this.canvasWidth * this._scale;
        this.canvas.height = this.canvasHeight * this._scale;
        this.canvas.style.width = `${this.canvasWidth}px`;
        this.canvas.style.height = `${this.canvasHeight}px`;
        this._context.scale(this._scale, this._scale);
        this._data = new Uint8Array((this._width / 8) * this._height);
        this._selection = new Uint8Array((this._width / 8) * this._height);
        this.resize();
        this.canvas.addEventListener("contextmenu", (event) => {
            event.preventDefault();
        });
        window.addEventListener("keydown", (event) => {
            switch (event.keyCode) {
                case 16: // Shift
                    this._shiftDown = true;
                    break;
            }
        });
        window.addEventListener("keyup", (event) => {
            switch (event.keyCode) {
                case 16: // Shift
                    this._shiftDown = false;
                    break;
                case 49: // 1
                    this.pencilMode();
                    break;
                case 50: // 2
                    this.eraserMode();
                    break;
                case 51: // 3
                    this.selectionMode();
                    break;
            }
        });
        this.canvas.addEventListener("mousedown", (event) => {
            this._mouseDown = true;
            this._mouseButton = event.button;
            this._selectionStartX = this._calculateXFromMouseCoords(event.offsetX);
            this._selectionStartY = this._calculateYFromMouseCoords(event.offsetY);
            this._selectionEndX = this._selectionStartX + 1;
            this._selectionEndY = this._selectionStartY + 1;
            if (!this._shiftDown) {
                this._selection.fill(0x0);
            }
            this._handleMouseEvent(event, this._mouseButton);
        });
        this.canvas.addEventListener("mousemove", (event) => {
            if (this._mouseDown) {
                this._handleMouseEvent(event, this._mouseButton);
            }
        });
        this.canvas.addEventListener("mouseup", (event) => {
            this._mouseDown = false;
        });
        this._downloadHelper = document.createElement("a");
        document.body.appendChild(this._downloadHelper);
        this._downloadHelper.style = "display: none";
    }
    pencilMode() {
        this._selection.fill(0x0);
        this._editorMode = Mode.PENCIL;
        this._redraw();
    }
    eraserMode() {
        this._selection.fill(0x0);
        this._editorMode = Mode.ERASER;
        this._redraw();
    }
    selectionMode() {
        this._editorMode = Mode.SELECTION;
        this._redraw();
    }
    setPixel(x, y) {
        const byte = this._calculateByteFromCoords(x, y);
        // const byte: number = ((y * (this._width / 8)) + Math.floor(x / 8));
        const mask = this._calculateByteMask(x);
        this._data[byte] = this._data[byte] |= mask;
    }
    unsetPixel(x, y) {
        const byte = this._calculateByteFromCoords(x, y);
        // const byte: number = ((y * (this._width / 8)) + Math.floor(x / 8));
        const mask = this._calculateByteMask(x);
        this._data[byte] = this._data[byte] &= ~mask;
    }
    selectPixel(x, y) {
        const byte = this._calculateByteFromCoords(x, y);
        // const byte: number = ((y * (this._width / 8)) + Math.floor(x / 8));
        const mask = this._calculateByteMask(x);
        this._selection[byte] = this._selection[byte] |= mask;
    }
    deselectPixel(x, y) {
        const byte = this._calculateByteFromCoords(x, y);
        // const byte: number = ((y * (this._width / 8)) + Math.floor(x / 8));
        const mask = this._calculateByteMask(x);
        this._selection[byte] = this._selection[byte] &= ~mask;
    }
    deselectAll() {
        this._selection.fill(0x0);
    }
    resize(width = this._width, height = this._height) {
        // TODO: Resize the data buffer
        this._width = width;
        this._height = height;
        this._pixelWidth = this.canvasWidth / width;
        this._pixelHeight = this.canvasHeight / height;
        this._redraw();
    }
    loadFromData(data, width, height) {
        this._data = data;
        this.resize(width, height);
    }
    saveSample(filename = "canvas") {
        const content = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 5, 0, 0, 0, 5, 8, 6, 0, 0, 0, 141, 111, 38, 229, 0, 0, 0, 28, 73, 68, 65, 84, 8, 215, 99, 248, 255, 255, 63, 195, 127, 6, 32, 5, 195, 32, 18, 132, 208, 49, 241, 130, 88, 205, 4, 0, 14, 245, 53, 203, 209, 142, 14, 31, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
        console.log("content ", content);
        const contentBlob = new Blob([content], { type: "image/bmp" });
        const url = window.URL.createObjectURL(contentBlob);
        this._downloadHelper.href = url;
        this._downloadHelper.download = filename;
        this._downloadHelper.click();
        window.URL.revokeObjectURL(url);
    }
    saveToFile2(filename = "test.bmp") {
        const blob = new Blob([this._data], { type: "image/bmp" });
        const url = window.URL.createObjectURL(blob);
        this._downloadHelper.href = url; // this._context.canvas.toDataURL("image/bmp").replace("image/png", "image/octet-stream")
        this._downloadHelper.download = filename;
        this._downloadHelper.click();
        window.URL.revokeObjectURL(url);
        console.log("------------");
        console.log("data ", this._data);
        // canvas approach
        const img1 = document.getElementById("test-img");
        const canvasImage = this._context.canvas.toDataURL("image/bmp");
        img1.src = canvasImage; // url1;       
        //    canvas download approach
        //    const link = document.getElementById("link");
        //    link.setAttribute("download", "canvasToDataURL.bmp");
        //    link.setAttribute("href", this._context.canvas.toDataURL("image/bmp").replace("image/png", "image/octet-stream"));
        //    link.click();
    }
    saveToFile(filename) {
        const blob = new Blob([this._data], { type: "octet/stream" });
        const url = window.URL.createObjectURL(blob);
        this._downloadHelper.href = url;
        this._downloadHelper.download = filename;
        this._downloadHelper.click();
        window.URL.revokeObjectURL(url);
    }
    get height() {
        return this._height;
    }
    set height(height) {
        this.resize(this._width, height);
    }
    get width() {
        return this._width;
    }
    set width(width) {
        this.resize(width, this._height);
    }
    _calculateByteFromCoords(x, y) {
        return Math.floor(((y * this._width) + x) / 8);
    }
    _calculateByteMask(x) {
        return 1 << (x % 8);
    }
    _calculateXFromMouseCoords(mouseX, round = Math.floor) {
        return round(mouseX / this._pixelWidth);
    }
    _calculateYFromMouseCoords(mouseY, round = Math.floor) {
        return round(mouseY / this._pixelHeight);
    }
    _handleMouseEvent(event, button) {
        let mouseX = this._calculateXFromMouseCoords(event.offsetX);
        let mouseY = this._calculateYFromMouseCoords(event.offsetY);
        switch (this._editorMode) {
            case Mode.PENCIL:
                if (button === MouseButton.LEFT) {
                    this.setPixel(mouseX, mouseY);
                }
                else if (button === MouseButton.RIGHT) {
                    this.unsetPixel(mouseX, mouseY);
                }
                break;
            case Mode.ERASER:
                if (button === MouseButton.LEFT) {
                    this.unsetPixel(mouseX, mouseY);
                }
                else if (button === MouseButton.RIGHT) {
                    this.setPixel(mouseX, mouseY);
                }
                break;
            case Mode.SELECTION:
                if (!this._shiftDown) {
                    mouseX = this._calculateXFromMouseCoords(event.offsetX, Math.ceil);
                    mouseY = this._calculateYFromMouseCoords(event.offsetY, Math.ceil);
                    this._selection.fill(0x0);
                    this._selectionEndX = mouseX;
                    this._selectionEndY = mouseY;
                    const startX = this._selectionEndX > this._selectionStartX ? this._selectionStartX : this._selectionEndX - 1;
                    const startY = this._selectionEndY > this._selectionStartY ? this._selectionStartY : this._selectionEndY - 1;
                    const endX = this._selectionEndX > this._selectionStartX ? this._selectionEndX : this._selectionStartX + 1;
                    const endY = this._selectionEndY > this._selectionStartY ? this._selectionEndY : this._selectionStartY + 1;
                    for (let x = startX; x < endX; x++) {
                        for (let y = startY; y < endY; y++) {
                            this.selectPixel(x, y);
                        }
                    }
                }
                else {
                    if (this._isSelected(mouseX, mouseY)) {
                        this.deselectPixel(mouseX, mouseY);
                    }
                    else {
                        this.selectPixel(mouseX, mouseY);
                    }
                }
                break;
        }
        this._redraw();
    }
    _isSelected(x, y) {
        if (x < 0 || y < 0) {
            return false;
        }
        else if (x > this._width - 1 || y > this._height - 1) {
            return false;
        }
        const byte = this._calculateByteFromCoords(x, y);
        const mask = this._calculateByteMask(x);
        if ((this._selection[byte] & mask) >= 1) {
            return true;
        }
        return false;
    }
    _redraw() {
        this._drawGrid();
        this._drawPixels();
        if (this._editorMode === Mode.SELECTION) {
            this._drawSelection();
        }
    }
    _drawGrid() {
        this._context.fillStyle = "#FFFFFF";
        this._context.strokeStyle = "#CCCCCC";
        this._context.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        this._context.beginPath();
        this._context.moveTo(0, 0);
        this._context.lineTo(this.canvasWidth, 0);
        this._context.stroke();
        this._context.beginPath();
        this._context.moveTo(0, 0);
        this._context.lineTo(0, this.canvasHeight);
        this._context.stroke();
        for (let i = 0; i < (this._width); i++) {
            const x = Math.floor((this.canvasWidth / this._width) * (i + 1));
            this._context.beginPath();
            this._context.moveTo(x, 0);
            this._context.lineTo(x, this.canvasHeight);
            this._context.stroke();
        }
        for (let j = 0; j < (this._height); j++) {
            const y = Math.floor((this.canvasHeight / this._height) * (j + 1));
            this._context.beginPath();
            this._context.moveTo(0, y);
            this._context.lineTo(this.canvasWidth, y);
            this._context.stroke();
        }
    }
    _drawPixels() {
        this._context.fillStyle = "#000000";
        this._context.strokeStyle = "#FFFFFFF";
        for (let i = 0; i < this._height; i++) {
            for (let j = 0; j < (this._width / 8); j++) {
                let byte = this._data[(i * (this._width / 8)) + j];
                for (let k = 0; k < 8; k++) {
                    if (byte & 1) {
                        const startX = 0.5 + (((j * 8) + k) * this._pixelWidth);
                        const startY = 0.5 + (i * this._pixelHeight);
                        this._context.fillRect(startX, startY, this._pixelWidth - 1, this._pixelHeight - 1);
                    }
                    byte = byte >> 1;
                }
            }
        }
    }
    _drawSelection() {
        this._context.strokeStyle = "#FF0000";
        for (let x = 0; x < this._width; x++) {
            for (let y = 0; y < this._height; y++) {
                const byte = this._calculateByteFromCoords(x, y);
                const mask = this._calculateByteMask(x);
                if (this._isSelected(x, y)) {
                    if (!this._isSelected(x - 1, y)) {
                        this._context.beginPath();
                        this._context.moveTo(x * this._pixelWidth, y * this._pixelHeight);
                        this._context.lineTo(x * this._pixelWidth, (y * this._pixelHeight) + this._pixelHeight);
                        this._context.stroke();
                    }
                    if (!this._isSelected(x, y - 1)) {
                        this._context.beginPath();
                        this._context.moveTo(x * this._pixelWidth, y * this._pixelHeight);
                        this._context.lineTo((x * this._pixelWidth) + this._pixelWidth, y * this._pixelHeight);
                        this._context.stroke();
                    }
                    if (!this._isSelected(x + 1, y)) {
                        this._context.beginPath();
                        this._context.moveTo((x * this._pixelWidth) + this._pixelWidth, y * this._pixelHeight);
                        this._context.lineTo((x * this._pixelWidth) + this._pixelWidth, (y * this._pixelHeight) + this._pixelHeight);
                        this._context.stroke();
                    }
                    if (!this._isSelected(x, y + 1)) {
                        this._context.beginPath();
                        this._context.moveTo(x * this._pixelWidth, (y * this._pixelHeight) + this._pixelHeight);
                        this._context.lineTo((x * this._pixelWidth) + this._pixelWidth, (y * this._pixelHeight) + this._pixelHeight);
                        this._context.stroke();
                    }
                }
            }
        }
    }
}
class Serialisers {
    static readInt32(data, start, littleEndian = false) {
        // console.log(new DataView(data.buffer.slice(start, start + 4)).getInt32(0));
        return new DataView(data.buffer).getInt32(start, littleEndian);
    }
    static readUint32(data, start, littleEndian = false) {
        // console.log(data.buffer.slice(start, start + 4));
        // console.log(new DataView(data.buffer).getUint32(start, littleEndian));
        return new DataView(data.buffer).getUint32(start, littleEndian);
    }
    static readUint16(data, start, littleEndian = false) {
        return new DataView(data.buffer).getUint16(start, littleEndian);
    }
    static reverseUint32BitOrder(data) {
        let i = 0;
        let reversed = 0;
        let last = 0;
        while (i < 31) {
            last = data & 1;
            data >>= 1;
            reversed += last;
            reversed <<= 1;
            i++;
        }
        return reversed;
    }
}
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
