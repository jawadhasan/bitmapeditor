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
