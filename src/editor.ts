interface IEditorConstructorOptions {
    canvas: HTMLCanvasElement;
    canvasWidth: number;
    canvasHeight: number;
    width: number;
    height: number;
}


enum MouseButton {
    LEFT = 0,
    RIGHT = 2
}


enum Mode {
    PENCIL = 0,
    ERASER = 1,
    SELECTION = 2
}


class Editor {


    public canvasWidth: number;
    public canvasHeight: number;
    public canvas: HTMLCanvasElement;

    private _context: CanvasRenderingContext2D;

    private _width: number;
    private _height: number;
    private _scale: number;
    private _deviceRatio: number;

    private _pixelWidth: number = 0;
    private _pixelHeight: number = 0;

    private _mouseDown: boolean = false;
    private _mouseButton: MouseButton;

    private _shiftDown: boolean = false;

    private _selectionStartX: number = 0;
    private _selectionStartY: number = 0;
    private _selectionEndX: number = 0;
    private _selectionEndY: number = 0;

    private _editorMode: Mode = Mode.PENCIL;

    private _downloadHelper: HTMLAnchorElement;

    private _data: Uint8Array;
    private _selection: Uint8Array;


    constructor (options: IEditorConstructorOptions) {

        options = options || {} as IEditorConstructorOptions;

        if (options.canvas) {
            this.canvas = options.canvas;
        } else {
            throw new Error("Editor must be initialized with a canvas.");
        }

        if (options.canvasWidth) {
            this.canvasWidth = options.canvasWidth;
        } else {
            throw new Error("Editor must be constructed with a canvasWidth.");
        }

        if (options.canvasHeight) {
            this.canvasHeight = options.canvasHeight;
        } else {
            throw new Error("Editor must be constructed with a canvasHeight.");
        }

        if (options.width) {
            this._width = options.width;
        } else {
            throw new Error("Editor must be constructed with a width.");
        }

        if (options.height) {
            this._height = options.height;
        } else {
            throw new Error("Editor must be constructed with a height.");
        }

        this._context = this.canvas.getContext("2d") as CanvasRenderingContext2D;

        const deviceRatio: number = window.devicePixelRatio || 1;
        const backingStoreRatio: number = (this._context as any).backingStorePixelRatio as number || 1;

        this._scale = deviceRatio / backingStoreRatio;
        this._deviceRatio = deviceRatio;

        this.canvas.width = this.canvasWidth * this._scale;
        this.canvas.height = this.canvasHeight * this._scale;
        this.canvas.style.width = `${this.canvasWidth}px`;
        this.canvas.style.height = `${this.canvasHeight}px`;

        this._context.scale(this._scale, this._scale);

        //new Uint8Array(4); // 4 bytes long
        this._data = new Uint8Array((this._width / 8) * this._height);
        this._selection = new Uint8Array((this._width / 8) * this._height);

        this.resize();

        this.canvas.addEventListener("contextmenu", (event: MouseEvent) => {
            event.preventDefault();
        });

        window.addEventListener("keydown", (event: KeyboardEvent) => {
            switch (event.keyCode) {
                case 16: // Shift
                    this._shiftDown = true;
                    break;
            }
        });

        window.addEventListener("keyup", (event: KeyboardEvent) => {
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

        this.canvas.addEventListener("mousedown", (event: MouseEvent) => {
            this._mouseDown = true;
            this._mouseButton = event.button as MouseButton;
            this._selectionStartX = this._calculateXFromMouseCoords(event.offsetX);
            this._selectionStartY = this._calculateYFromMouseCoords(event.offsetY);
            this._selectionEndX = this._selectionStartX + 1;
            this._selectionEndY = this._selectionStartY + 1;
            if (!this._shiftDown) {
                this._selection.fill(0x0);
            }
            this._handleMouseEvent(event, this._mouseButton);
        });

        this.canvas.addEventListener("mousemove", (event: MouseEvent) => {
            if (this._mouseDown) {
                this._handleMouseEvent(event, this._mouseButton);
            }
        });

        this.canvas.addEventListener("mouseup", (event: MouseEvent) => {
            this._mouseDown = false;
        });

        this._downloadHelper = document.createElement("a");
        document.body.appendChild(this._downloadHelper);
        (this._downloadHelper as any).style = "display: none";

    }


    public pencilMode () {
        this._selection.fill(0x0);
        this._editorMode = Mode.PENCIL;
        this._redraw();
    }


    public eraserMode () {
        this._selection.fill(0x0);
        this._editorMode = Mode.ERASER;
        this._redraw();
    }


    public selectionMode () {
        this._editorMode = Mode.SELECTION;
        this._redraw();
    }


    public setPixel (x: number, y: number): void {
        const byte: number = this._calculateByteFromCoords(x, y);
        // const byte: number = ((y * (this._width / 8)) + Math.floor(x / 8));
        const mask: number = this._calculateByteMask(x);
        console.log('mask:', mask);
        this._data[byte] = this._data[byte] |= mask;
        //console.log('Bit-Wise OR: ',this._data[byte]);
    }


    public unsetPixel (x: number, y: number): void {
        const byte: number = this._calculateByteFromCoords(x, y);
        // const byte: number = ((y * (this._width / 8)) + Math.floor(x / 8));
        const mask: number = this._calculateByteMask(x);
        this._data[byte] = this._data[byte] &= ~mask;
    }


    public selectPixel (x: number, y: number): void {
        const byte: number = this._calculateByteFromCoords(x, y);
        // const byte: number = ((y * (this._width / 8)) + Math.floor(x / 8));
        const mask: number = this._calculateByteMask(x);
        this._selection[byte] = this._selection[byte] |= mask;
    }


    public deselectPixel (x: number, y: number): void {
        const byte: number = this._calculateByteFromCoords(x, y);
        // const byte: number = ((y * (this._width / 8)) + Math.floor(x / 8));
        const mask: number = this._calculateByteMask(x);
        this._selection[byte] = this._selection[byte] &= ~mask;
    }


    public deselectAll (): void {
        this._selection.fill(0x0);
    }


    public resize (width: number = this._width, height: number = this._height): void {
        // TODO: Resize the data buffer
        this._width = width;
        this._height = height;
        this._pixelWidth = this.canvasWidth / width;
        this._pixelHeight = this.canvasHeight / height;
        this._redraw();
    }


    public loadFromData (data: Uint8Array, width: number, height: number) {
        this._data = data;
        this.resize(width, height);
    }

    public saveSample(filename: string){
        const testData: Uint8Array = new Uint8Array([66, 77, 190, 0, 0, 0, 0, 0, 0, 0, 62, 0, 0, 0, 40, 0, 0, 0, 32, 0, 0, 0, 32, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 128, 0, 0, 0, 116, 18, 0, 0, 116, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 0, 0, 0, 15, 255, 255, 255, 247, 246, 142, 115, 183, 246, 181, 173, 183, 240, 141, 173, 183, 246, 181, 173, 183, 249, 142, 109, 23, 255, 255, 255, 247, 246, 141, 127, 247, 246, 189, 127, 247, 244, 138, 191, 247, 242, 186, 191, 247, 246, 138, 191, 247, 255, 255, 255, 247, 247, 139, 71, 247, 247, 187, 123, 247, 241, 184, 67, 247, 246, 187, 91, 247, 241, 188, 219, 247, 255, 255, 255, 247]);
        const testData2 = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 5, 0, 0, 0, 5, 8, 6, 0, 0, 0, 141, 111, 38, 229, 0, 0, 0, 28, 73, 68, 65, 84, 8, 215, 99, 248, 255, 255, 63, 195, 127, 6, 32, 5, 195, 32, 18, 132, 208, 49, 241, 130, 88, 205, 4, 0, 14, 245, 53, 203, 209, 142, 14, 31, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
        console.log("data ", testData);

        const contentBlob = new Blob([testData], { type: "image/bmp" });
        const url = window.URL.createObjectURL(contentBlob);

        this._downloadHelper.href = url;
        this._downloadHelper.download = filename;
        this._downloadHelper.click();
        window.URL.revokeObjectURL(url);
    }

    public saveSampleCanvas (filename: string) {   
        // canvas show example 
        const img1 = document.getElementById("test-img") as HTMLImageElement;
        const canvasImage = this._context.canvas.toDataURL("image/bmp");
        img1.src = canvasImage; 

     //    canvas download approach
        const link = document.getElementById("link");
        link.setAttribute("download", filename);
        link.setAttribute("href", this._context.canvas.toDataURL("image/bmp").replace("image/png", "image/octet-stream"));
        link.click();
 
 
     }


     public saveData() {
        var arrayBuffer = new ArrayBuffer(this._data.length);
        var dataView = new DataView(arrayBuffer);
        for(var i = 0; i < this._data.length; i ++) {
          //  dataView.setUint8(i, this._data.charCodeAt(i));
        }
        var blob = new Blob([dataView], {type: "application/octet-stream"});
       // saveAs(blob, "test.bmp");
    }

    public saveManualImg(){
        //https://stackoverflow.com/questions/50620821/uint8array-to-image-in-javascript
        const header_size = 54;

        const width = 255;
        const height = 255;
           
        const image_size = width * height * 4;
    
        const arr = new Uint8Array(header_size + image_size);
        const view = new DataView(arr.buffer);
    
        // File Header
    
        // BM magic number.
        view.setUint16(0, 0x424D, false);
        // File size.
        view.setUint32(2, arr.length, true);
        // Offset to image data.
        view.setUint32(10, header_size, true);
    
        // BITMAPINFOHEADER
    
        // Size of BITMAPINFOHEADER
        view.setUint32(14, 40, true);
        // Width
        view.setInt32(18, width, true);
        // Height (signed because negative values flip
        // the image vertically).
        view.setInt32(22, height, true);
        // Number of colour planes (colours stored as
        // separate images; must be 1).
        view.setUint16(26, 1, true);
        // Bits per pixel.
        view.setUint16(28, 32, true);
        // Compression method, 0 = BI_RGB
        view.setUint32(30, 0, true);
        // Image size in bytes.
        view.setUint32(34, image_size, true);
        // Horizontal resolution, pixels per metre.
        // This will be unused in this situation.
        view.setInt32(38, 10000, true);
        // Vertical resolution, pixels per metre.
        view.setInt32(42, 10000, true);
        // Number of colours. 0 = all
        view.setUint32(46, 0, true);
        // Number of important colours. 0 = all
        view.setUint32(50, 0, true);
    
        // Pixel data.
        for (let w = 0; w < width; ++w) {
          for (let h = 0; h < height; ++h) {
            const offset = header_size + (h * width + w) * 4;
            arr[offset + 0] = w;     // R value
            arr[offset + 1] = h;     // G value
            arr[offset + 2] = 255-w; // B value
            // arr[offset + 3] is ignored but must still be present because we specified 32 BPP
          }
        }
    
      
const blob = new Blob([arr], { type: "image/bmp" });
const url = window.URL.createObjectURL(blob);

this._downloadHelper.href = url;
this._downloadHelper.download = 'save2.bmp';
this._downloadHelper.click();
window.URL.revokeObjectURL(url);

// const img = document.getElementById('i');
// img.src = url;
}
 
public saveMix(){
    const header_size = 54;

    const width = 255;
    const height = 255;
       
    const image_size = width * height * 4;

    const arr = this._data.buffer;
    const view = new DataView(this._data.buffer);

      // File Header
    
        // BM magic number.
        view.setUint16(0, 0x424D, false);
        // File size.
        view.setUint32(2, this._data.length, true);
        // Offset to image data.
        view.setUint32(10, header_size, true);

          // BITMAPINFOHEADER
    
        // Size of BITMAPINFOHEADER
        view.setUint32(14, 40, true);
        // Width
        view.setInt32(18, width, true);
        // Height (signed because negative values flip
        // the image vertically).
        view.setInt32(22, height, true);
        // Number of colour planes (colours stored as
        // separate images; must be 1).
        view.setUint16(26, 1, true);
        // Bits per pixel.
        view.setUint16(28, 32, true);
        // Compression method, 0 = BI_RGB
        view.setUint32(30, 0, true);
        // Image size in bytes.
        view.setUint32(34, image_size, true);
        // Horizontal resolution, pixels per metre.
        // This will be unused in this situation.
        view.setInt32(38, 10000, true);
        // Vertical resolution, pixels per metre.
        view.setInt32(42, 10000, true);
        // Number of colours. 0 = all
        view.setUint32(46, 0, true);
        // Number of important colours. 0 = all
        view.setUint32(50, 0, true);

               // Pixel data.
  
         

}
    public saveToFile (filename: string) {
        console.log('data content', this._data);
        // const blob: Blob = new Blob([this._data], {type: "octet/stream"}); // {type: "application/octet-stream"}
        const blob: Blob = new Blob([this._data], {type: "image/bmp"});
        const url: string = window.URL.createObjectURL(blob);
        this._downloadHelper.href = url;
        this._downloadHelper.download = filename;
        this._downloadHelper.click();
        window.URL.revokeObjectURL(url);
    }

    get height (): number {
        return this._height;
    }


    set height (height: number) {
        this.resize(this._width, height);
    }


    get width (): number {
        return this._width;
    }


    set width (width: number) {
        this.resize(width, this._height);
    }


    private _calculateByteFromCoords (x: number, y: number): number {
        return Math.floor(((y * this._width) + x) / 8);
    }


    private _calculateByteMask (x: number) {
        return 1 << (x % 8);
    }


    private _calculateXFromMouseCoords (mouseX: number, round: ((num: number) => number) = Math.floor): number {
        return round(mouseX / this._pixelWidth);
    }


    private _calculateYFromMouseCoords (mouseY: number, round: ((num: number) => number) = Math.floor): number {
        return round(mouseY / this._pixelHeight);
    }


    private _handleMouseEvent (event: MouseEvent, button: number): void {

        let mouseX: number = this._calculateXFromMouseCoords(event.offsetX);
        let mouseY: number = this._calculateYFromMouseCoords(event.offsetY);

        switch (this._editorMode) {
            case Mode.PENCIL:

                if (button === MouseButton.LEFT) {
                    this.setPixel(mouseX, mouseY);
                } else if (button === MouseButton.RIGHT) {
                    this.unsetPixel(mouseX, mouseY);
                }

                break;
            case Mode.ERASER:

                if (button === MouseButton.LEFT) {
                    this.unsetPixel(mouseX, mouseY);
                } else if (button === MouseButton.RIGHT) {
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

                    const startX: number = this._selectionEndX > this._selectionStartX ? this._selectionStartX : this._selectionEndX - 1;
                    const startY: number = this._selectionEndY > this._selectionStartY ? this._selectionStartY : this._selectionEndY - 1;
                    const endX: number = this._selectionEndX > this._selectionStartX ? this._selectionEndX : this._selectionStartX + 1;
                    const endY: number = this._selectionEndY > this._selectionStartY ? this._selectionEndY : this._selectionStartY + 1;

                    for (let x: number = startX; x < endX; x++) {
                        for (let y: number = startY; y < endY; y++) {
                            this.selectPixel(x, y);
                        }
                    }
                } else {
                    if (this._isSelected(mouseX, mouseY)) {
                        this.deselectPixel(mouseX, mouseY);
                    } else {
                        this.selectPixel(mouseX, mouseY);
                    }
                }

                break;
        }

        this._redraw();

    }


    private _isSelected (x: number, y: number): boolean {
        if (x < 0 || y < 0) {
            return false;
        } else if (x > this._width - 1 || y > this._height - 1) {
            return false;
        }

        const byte: number = this._calculateByteFromCoords(x, y);
        const mask: number = this._calculateByteMask(x);

        if ((this._selection[byte] & mask) >= 1) {
            return true;
        }

        return false;

    }


    private _redraw (): void {
        this._drawGrid();
        this._drawPixels();
        if (this._editorMode === Mode.SELECTION) {
            this._drawSelection();
        }
    }


    private _drawGrid (): void {

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

        for (let i: number = 0; i < (this._width); i++) {

            const x: number = Math.floor((this.canvasWidth / this._width) * (i + 1));

            this._context.beginPath();
            this._context.moveTo(x, 0);
            this._context.lineTo(x, this.canvasHeight);
            this._context.stroke();

        }

        for (let j: number = 0; j < (this._height); j++) {

            const y: number = Math.floor((this.canvasHeight / this._height) * (j + 1));

            this._context.beginPath();
            this._context.moveTo(0, y);
            this._context.lineTo(this.canvasWidth, y);
            this._context.stroke();

        }

    }


    private _drawPixels (): void {

        this._context.fillStyle = "#000000";
        this._context.strokeStyle = "#FFFFFFF";

        for (let i: number = 0; i < this._height; i++) {
            for (let j: number = 0; j < (this._width / 8); j++) {

                let byte: number = this._data[(i * (this._width / 8)) + j];

                for (let k: number = 0; k < 8; k++) {
                    if (byte & 1) {

                        const startX: number = 0.5 + (((j * 8) + k) * this._pixelWidth);
                        const startY: number = 0.5 + (i * this._pixelHeight);

                        this._context.fillRect(startX, startY, this._pixelWidth - 1, this._pixelHeight - 1);

                    }
                    byte = byte >> 1;
                }

            }
        }

    }


    private _drawSelection (): void {

        this._context.strokeStyle = "#FF0000";

        for (let x: number = 0; x < this._width; x++) {
            for (let y: number = 0; y < this._height; y++) {

                const byte: number = this._calculateByteFromCoords(x, y);
                const mask: number = this._calculateByteMask(x);

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
