export class CommandStack {
    stack = [];
    index = -1;
    listeners = new Set();
    execute(command) {
        this.stack = this.stack.slice(0, this.index + 1);
        command.execute();
        this.stack.push(command);
        this.index = this.stack.length - 1;
        this.notify();
    }
    undo() {
        if (!this.canUndo())
            return;
        this.stack[this.index].undo();
        this.index -= 1;
        this.notify();
    }
    redo() {
        if (!this.canRedo())
            return;
        this.index += 1;
        this.stack[this.index].execute();
        this.notify();
    }
    canUndo() {
        return this.index >= 0;
    }
    canRedo() {
        return this.index < this.stack.length - 1;
    }
    get size() {
        return this.stack.length;
    }
    get currentIndex() {
        return this.index;
    }
    clear() {
        this.stack = [];
        this.index = -1;
        this.notify();
    }
    onChange(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    notify() {
        for (const l of this.listeners)
            l();
    }
}
