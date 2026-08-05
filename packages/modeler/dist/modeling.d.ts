import { type ConnectionType, type ElementLink, type LayoutEntry, type SphereModel, type SphereConnection } from "@spherescan/model";
import type { NodeKind } from "@spherescan/viewer";
import { CommandStack } from "./command-stack.js";
import { type AutoLayoutOptions } from "./auto-layout.js";
import { type MergeOptions } from "./merge.js";
export type CreateKind = "service" | "datastore" | "search" | "event-stream" | "external-system" | "agent" | "repository";
export declare function cloneModel(model: SphereModel): SphereModel;
export declare function createId(prefix: string): string;
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
    /** Commit several element moves as one undo step (after multi-drag preview). */
    commitElementMoves(updates: Array<{
        id: string;
        x: number;
        y: number;
        ox: number;
        oy: number;
    }>): void;
    /** Update layout without stacking (used while dragging); commit via moveElement on pointer up. */
    previewMove(id: string, x: number, y: number): void;
    renameElement(id: string, name: string): void;
    /** Set or clear a custom diagram icon (Lucide name, URL, or data URL). */
    updateElementIcon(id: string, icon: string | null): void;
    /** Set or clear free-text `description` on a diagram element. */
    updateElementDescription(id: string, description: string | null): void;
    /** Update author-facing metadata on a component, external system, or agent. */
    updateElementMeta(id: string, patch: {
        description?: string | null;
        notes?: string | null;
        technology?: string | null;
        subtitle?: string | null;
    }): void;
    /** Set or clear an inline source repository reference. */
    setElementRepository(id: string, repository: string | {
        provider?: string;
        path: string;
    } | null): void;
    addElementLink(id: string, link: ElementLink): void;
    removeElementLink(id: string, index: number): void;
    updateElementLink(id: string, index: number, link: ElementLink): void;
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
    /**
     * Clone a trust/runtime boundary with a new id and offset rect.
     * Membership is re-derived from element centers inside the new box.
     */
    duplicateBoundary(id: string, offset?: {
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
    bringBoundaryForward(id: string): void;
    sendBoundaryBackward(id: string): void;
    bringBoundaryToFront(id: string): void;
    sendBoundaryToBack(id: string): void;
    private reorderBoundary;
    /** Set an active-view orthogonal route, or clear it to restore auto-routing. */
    updateConnectionRoute(id: string, waypoints: Array<{
        x: number;
        y: number;
    }> | null, sides?: {
        fromSide: NonNullable<SphereConnection["fromSide"]>;
        toSide: NonNullable<SphereConnection["toSide"]>;
    }): void;
    /** Live move while dragging; commit with moveBoundary on pointer up. Moves members with the box. */
    previewMoveBoundary(id: string, x: number, y: number): void;
    /** Translate a boundary and all of its members by the same delta. Undoable. */
    moveBoundary(id: string, x: number, y: number): void;
    /**
     * Commit several boundary moves (each with member translation) as one undo step.
     * `updates` use final x/y; `ox`/`oy` are positions before the drag.
     */
    commitBoundaryMoves(updates: Array<{
        id: string;
        x: number;
        y: number;
        ox: number;
        oy: number;
    }>): void;
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
    /** Merges another SCAN document's elements/connections into the current
     *  model as a single undoable step (id collisions remapped, incoming
     *  content offset to avoid overlapping existing nodes). */
    mergeYAML(yaml: string, options?: MergeOptions): void;
}
export declare function nodeKindToCreateKind(kind: NodeKind): CreateKind | null;
export {};
