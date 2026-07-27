export type Command = {
    id: string;
    label?: string;
    execute: () => void;
    undo: () => void;
};
export declare class CommandStack {
    private stack;
    private index;
    private listeners;
    execute(command: Command): void;
    undo(): void;
    redo(): void;
    canUndo(): boolean;
    canRedo(): boolean;
    get size(): number;
    get currentIndex(): number;
    clear(): void;
    onChange(listener: () => void): () => void;
    private notify;
}
