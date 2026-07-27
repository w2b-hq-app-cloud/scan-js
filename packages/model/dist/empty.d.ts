import { type ScanModel } from "./schema.js";
export type CreateEmptyModelOptions = {
    /** System id; default derived from name */
    systemId?: string;
    /** View id for the empty board layout */
    viewId?: string;
    purpose?: string;
    owner?: string;
};
/** Slug suitable for system / view ids. */
export declare function slugifyId(name: string): string;
/**
 * Create a valid empty SCAN model with one view and empty layout.
 * Use as the starting point for a new architecture board.
 */
export declare function createEmptyModel(systemName: string, options?: CreateEmptyModelOptions): ScanModel;
/** @deprecated Use createEmptyModel */
export declare const createEmptySphereModel: typeof createEmptyModel;
