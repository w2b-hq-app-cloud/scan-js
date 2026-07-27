export type Command = {
  id: string;
  label?: string;
  execute: () => void;
  undo: () => void;
};

export class CommandStack {
  private stack: Command[] = [];
  private index = -1;
  private listeners = new Set<() => void>();

  execute(command: Command): void {
    this.stack = this.stack.slice(0, this.index + 1);
    command.execute();
    this.stack.push(command);
    this.index = this.stack.length - 1;
    this.notify();
  }

  undo(): void {
    if (!this.canUndo()) return;
    this.stack[this.index].undo();
    this.index -= 1;
    this.notify();
  }

  redo(): void {
    if (!this.canRedo()) return;
    this.index += 1;
    this.stack[this.index].execute();
    this.notify();
  }

  canUndo(): boolean {
    return this.index >= 0;
  }

  canRedo(): boolean {
    return this.index < this.stack.length - 1;
  }

  get size(): number {
    return this.stack.length;
  }

  get currentIndex(): number {
    return this.index;
  }

  clear(): void {
    this.stack = [];
    this.index = -1;
    this.notify();
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const l of this.listeners) l();
  }
}
