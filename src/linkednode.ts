class LinkedNode {


    private _prev: LinkedNode;
    private _next: LinkedNode;


    get next (): LinkedNode {
        return this._next;
    }


    set next (node: LinkedNode) {
        this._next = node;
        if (node.prev !== this) {
            node.prev = this;
        }
    }


    get prev (): LinkedNode {
        return this._prev;
    }


    set prev (node: LinkedNode) {
        this._prev = node;
        if (node.next !== this) {
            node.next = this;
        }
    }


}
