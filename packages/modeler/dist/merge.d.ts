import type { SphereModel } from "@spherescan/model";
export type MergeOptions = {
    /** Pixel offset applied to incoming nodes/boundaries. Defaults to placing
     *  incoming content to the right of the target's current bounds. */
    offset?: {
        x: number;
        y: number;
    };
};
/**
 * Merges `incoming`'s elements/connections/boundaries/layout (for `viewId`,
 * or its first view) into a clone of `target`, remapping any colliding ids
 * and offsetting incoming content so it doesn't overlap existing nodes.
 * Returns the merged model; does not mutate either input.
 */
export declare function mergeModels(target: SphereModel, incoming: SphereModel, viewId?: string, options?: MergeOptions): SphereModel;
