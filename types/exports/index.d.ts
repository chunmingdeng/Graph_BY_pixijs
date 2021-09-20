export default class Exports {
    constructor();

    /**
     * export json
     * @returns {Promise<string>}
     */
    json(): Promise<string>;

    /**
     *
     * @param width {number}
     * @param height {number}
     * @param clip {boolean} If true, export the current view rather than the whole graph
     * @returns {Promise<string>}
     */
    png(width: number, height: number, clip?: boolean): Promise<string>;
}
