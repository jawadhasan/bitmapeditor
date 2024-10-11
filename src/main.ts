window.onload = (): void => {

    console.log('main entry point');
    const editor: Editor = new Editor({
        canvas: document.getElementById("editor") as HTMLCanvasElement,
        canvasHeight: 280,
        canvasWidth: 280,
        height: 32,
        width: 32
    });

    (document.getElementById("pencil_mode_button") as HTMLAnchorElement).addEventListener("click", (event: MouseEvent) => {
        event.preventDefault();
        editor.pencilMode();
    });

    (document.getElementById("eraser_mode_button") as HTMLAnchorElement).addEventListener("click", (event: MouseEvent) => {
        event.preventDefault();
        editor.eraserMode();
    });

    (document.getElementById("selection_mode_button") as HTMLAnchorElement).addEventListener("click", (event: MouseEvent) => {
        event.preventDefault();
        editor.selectionMode();
    });

    (document.getElementById("save_file_button") as HTMLAnchorElement).addEventListener("click", (event: MouseEvent) => {
        event.preventDefault();
        const filename: string = (document.getElementById("filename_input") as HTMLInputElement).value;
        editor.saveToFile(filename);
    });

    (document.getElementById("sample1_download_button") as HTMLButtonElement).addEventListener("click", (event: MouseEvent) => {
        event.preventDefault();
        const filename: string = "sample1.bmp";
        editor.saveSample(filename);
    });

    (document.getElementById("sample_manualimg_button") as HTMLButtonElement).addEventListener("click", (event: MouseEvent) => {
        event.preventDefault(); 
       editor.saveManualImg();
    });

    (document.getElementById("sample_savemix_button") as HTMLButtonElement).addEventListener("click", (event: MouseEvent) => {
        event.preventDefault(); 
       editor.saveMix();
    });


    (document.getElementById("sample_canvas_button") as HTMLButtonElement).addEventListener("click", (event: MouseEvent) => {
        event.preventDefault();
        const filename: string = "sample_canvas.bmp";
        editor.saveSampleCanvas(filename);
    });

    (document.getElementById("open_file_button") as HTMLAnchorElement).addEventListener("drop", (event: DragEvent) => {

        event.preventDefault();

        const dataTransfer: DataTransfer = event.dataTransfer;

        if (dataTransfer.items.length > 1) {
            alert("One file only!");
            return;
        }

        if (dataTransfer.items) {
            for (const item of (dataTransfer.items as any)) {

                const file: File = item.getAsFile();
                const fileReader: FileReader = new FileReader();

                fileReader.addEventListener("loadend", () => {

                    const data: Uint8Array = new Uint8Array(<ArrayBuffer>fileReader.result);

                    if (BMPTools.isPossiblyBMPFormat(data)) {
                        const bittMappData: IBittMappData = BMPTools.extractBitmap(data);
                        const pixelWidth = bittMappData.width;
                        const pixelHeight = bittMappData.height;
                        editor.loadFromData(bittMappData.data, pixelWidth, pixelHeight);
                    } else {
                        const pixelWidth = parseInt((document.getElementById("open_file_pixelwidth_input") as HTMLInputElement).value, 10);
                        const pixelHeight = parseInt((document.getElementById("open_file_pixelheight_input") as HTMLInputElement).value, 10);
                        editor.loadFromData(data, pixelWidth, pixelHeight);
                    }

                });

                fileReader.readAsArrayBuffer(file);
            }
        }
    });

    (document.getElementById("open_file_button") as HTMLAnchorElement).addEventListener("dragover", (event: DragEvent) => {
        event.preventDefault();
    });

};




// const testData: Uint8Array = new Uint8Array([66, 77, 190, 0, 0, 0, 0, 0, 0, 0, 62, 0, 0, 0, 40, 0, 0, 0, 32, 0, 0, 0, 32, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 128, 0, 0, 0, 116, 18, 0, 0, 116, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 0, 0, 0, 15, 255, 255, 255, 247, 246, 142, 115, 183, 246, 181, 173, 183, 240, 141, 173, 183, 246, 181, 173, 183, 249, 142, 109, 23, 255, 255, 255, 247, 246, 141, 127, 247, 246, 189, 127, 247, 244, 138, 191, 247, 242, 186, 191, 247, 246, 138, 191, 247, 255, 255, 255, 247, 247, 139, 71, 247, 247, 187, 123, 247, 241, 184, 67, 247, 246, 187, 91, 247, 241, 188, 219, 247, 255, 255, 255, 247]);
