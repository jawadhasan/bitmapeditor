class ActionNode extends LinkedNode {
    constructor(undo, redo) {
        super();
        this.undo = undo;
        this.redo = redo;
    }
}
