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
