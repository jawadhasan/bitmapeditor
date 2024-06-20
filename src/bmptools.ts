interface IBMPHeaderData {
    fileLength: number;
    headerLength: number;
    pixelDataOffset: number;
    width: number;
    height: number;
    planes: number;
    bitsPerPixel: number;
    compressed: number;
    imageSize: number;
    numberColors: number;
    importantColors: number;
    bytesRead: number;
}


interface IBittMappData {
    data: Uint8Array;
    width: number;
    height: number;
}


class BMPTools {


    public static extractBitmap (inputData: Uint8Array): IBittMappData {

        const headerData: IBMPHeaderData = BMPTools.extractHeaderData(inputData);
        const pixelData: Uint8Array = inputData.slice(headerData.pixelDataOffset, headerData.fileLength);
        const rowSize: number = (headerData.width - 1 - (headerData.width - 1) % 32 + 32) / 8;

        const outputData: Uint8Array = new Uint8Array(Math.ceil((headerData.width * headerData.height) / 8));

        if (headerData.height > 0) {
            let bitCount: number = 0;
            for (let y: number = headerData.height - 1; y >= 0; y--) {
                const rowStart: number = rowSize * y;
                for (let x: number = 0; x < headerData.width; x++) {
                    const inputByte: number = Math.floor(x / 8);
                    const outputByte: number = Math.floor((((headerData.height - 1 - y) * headerData.width) + x) / 8);
                    const inputMask: number = 1 << (x % 8);
                    const val: number = Serialisers.reverseUint32BitOrder(~pixelData[rowStart + inputByte] & inputMask) >> 24;
                    outputData[outputByte] = val + outputData[outputByte];
                    bitCount++;
                }
            }
        } else {
            throw new Error("Cannot read bitmaps of inverted height");
        }

        return {
            data: outputData,
            height: headerData.height,
            width: headerData.width
        };

    }


    public static extractHeaderData (inputData: Uint8Array): IBMPHeaderData {

        const headerData = {} as any;

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

        return (headerData as IBMPHeaderData);

    }


    public static isPossiblyBMPFormat (inputData: Uint8Array): boolean {

        if (inputData.length < 54) {
            return false;
        }

        if (!(inputData[0] === 0x42 && inputData[1] === 0x4d)) {
            return false;
        }

        const fileLen: number = Serialisers.readUint32(inputData, 2, true);
        if (fileLen !== inputData.length) {
            return false;
        }

        return true;

    }


}
