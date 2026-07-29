import type { ConnectionType, LayoutEntry, SphereModel, SphereConnection } from "@spherescan/model";
import type { NodeKind } from "@spherescan/viewer";
import { CommandStack } from "./command-stack.js";
import { type AutoLayoutOptions } from "./auto-layout.js";
export type CreateKind = "service" | "datastore" | "search" | "event-stream" | "external-system" | "agent" | "repository";
type BoundaryRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
/** Recompute boundary members from element centers inside each boundary rect. */
export declare function syncBoundaryMembership(view: {
    layout: Record<string, LayoutEntry>;
    boundaries: Array<{
        x: number;
        y: number;
        w: number;
        h: number;
        members: string[];
    }>;
}): void;
export declare class Modeling {
    private getModel;
    private setModel;
    private stack;
    private viewId?;
    constructor(getModel: () => SphereModel, setModel: (model: SphereModel) => void, stack: CommandStack, viewId?: string | undefined);
    private replace;
    moveElement(id: string, x: number, y: number): void;
    /** Update layout without stacking (used while dragging); commit via moveElement on pointer up. */
    previewMove(id: string, x: number, y: number): void;
    renameElement(id: string, name: string): void;
    /** Set or clear a custom diagram icon (Lucide name, URL, or data URL). */
    updateElementIcon(id: string, icon: string | null): void;
    renameSystem(name: string): void;
    deleteElement(id: string): void;
    /**
     * Clone an element with a new id and offset layout.
     * Ports are remapped to unique ids; connections are not copied.
     */
    duplicateElement(id: string, offset?: {
        x: number;
        y: number;
    }): string;
    deleteConnection(connectionId: string): void;
    updateConnection(connectionId: string, patch: {
        label?: string | null;
        contract?: string | null;
        operations?: string[] | null;
    }): void;
    createElement(kind: CreateKind, position: LayoutEntry, name?: string): string;
    /**
     * Create a trust/runtime boundary rectangle on the active view.
     * Members are derived from elements whose centers fall inside the rect.
     */
    createBoundary(kind: "trust" | "runtime", rect: BoundaryRect, label?: string): string;
    renameBoundary(id: string, label: string): void;
    updateBoundary(id: string, patch: {
        label?: string | null;
        tag?: string | null;
        kind?: "trust" | "runtime";
        icon?: string | null;
        color?: "svc" | "ext" | "data" | "event" | "search" | "agent" | "repo" | "warn" | null;
    }): void;
    deleteBoundary(id: string): void;
    /** Live move while dragging; commit with moveBoundary on pointer up. Moves members with the box. */
    previewMoveBoundary(id: string, x: number, y: number): void;
    /** Translate a boundary and all of its members by the same delta. Undoable. */
    moveBoundary(id: string, x: number, y: number): void;
    /** Live resize while dragging; commit with resizeBoundary on pointer up. */
    previewResizeBoundary(id: string, rect: BoundaryRect): void;
    resizeBoundary(id: string, rect: BoundaryRect): void;
    /**
     * Recompute view layout so nodes/boundaries do not overlap and edge
     * anchors face each other (labels stay readable). Undoable as one step.
     */
    autoLayout(options?: AutoLayoutOptions): void;
    connect(fromId: string, toId: string, options?: {
        type?: ConnectionType;
        fromSide?: SphereConnection["fromSide"];
        toSide?: SphereConnection["toSide"];
        label?: string;
        contract?: string;
        fromPort?: string;
        toPort?: string;
    }): string;
    addPort(elementId: string, role: "consume" | "expose", port?: {
        label?: string;
        protocol?: string;
    }): string;
    updatePort(elementId: string, portId: string, patch: {
        label?: string | null;
        protocol?: string | null;
    }): void;
    deletePort(elementId: string, portId: string): void;
}
export declare function nodeKindToCreateKind(kind: NodeKind): CreateKind | null;
export {};
