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
