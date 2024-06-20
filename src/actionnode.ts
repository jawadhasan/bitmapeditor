class ActionNode extends LinkedNode {


    public undo: () => void;
    public redo: () => void;


    constructor (undo: () => void, redo: () => void) {
        super();
        this.undo = undo;
        this.redo = redo;
    }


}
