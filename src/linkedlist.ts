class LinkedList {


    private _start: LinkedNode;
    private _end: LinkedNode;

    public push (node: LinkedNode): void {

        if (!this._start) {
            this._start = node;
            this._end = node;
            return;
        }

        this._end.next = node;
        this._end = node;

    }

    public pop (): LinkedNode | null {
        if (!this._end) {
            return null;
        }

        const node: LinkedNode = this._end;
        this._end = this._end.prev;
        return node;

    }

}
