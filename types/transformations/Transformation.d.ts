export default class Transformation {
    constructor();
    /**
     * Remove the transformation over the specified amount of time.
     * @param duration {number} -- Animation duration in ms
     * @returns {Promise<void>}
     */
    destroy(duration?: number): Promise<void>;
    /**
     * Disable the transformation over the specified amount of time.
     * @param duration {number} -- Animation duration in ms
     * @returns {Promise<void>}
     */
    disable(duration?: number): Promise<void>;
    /**
     * Enable the transformation over the specified amount of time.
     * @param duration {number} -- Animation duration in ms
     * @returns {Promise<void>}
     */
    enable(duration?: number): Promise<void>;
    /**
     * Returns the id of the transformation, a unique strictly positive integer.
     * @returns id {number}
     */
    getId(): void;
    /**
     * Retrieves the index of the transformation in the pipeline.
     * @returns index {number}
     */
    getIndex(): void;
    /**
     * Returns the name of the transformation.
     * @returns name {string} -- "node-filter"|"edge-filter"|"node-grouping"|"edge-grouping"
     */
    getName(): void;
    /**
     * Indicates if the transformation is enabled
     * @returns boolean
     */
    isEnabled(): void;
    /**
     * Refresh the transformation.
     * @returns {Promise<void>}
     */
    refresh(): Promise<void>;
    /**
     * Set the index of the transformation in the pipeline.
     * The transformation with the lower index is applied first,
     * the one with the higher index is applied last.
     * @param index
     * @returns {Promise<void>}
     */
    setIndex(index: number): Promise<void>;
    /**
     * Toggle the transformation over the specified amount of time.
     * @param duration {number} -- Animation duration in ms
     * @returns {Promise<void>}
     */
    toggle(duration?: number): Promise<void>;
    /**
     * Returns a Promise that resolves the first time the transformation is applied.
     * @returns {Promise<void>}
     */
    whenApplied(): Promise<void>;
}
