import { RawGraph } from '../core/RawData'

export default class Parse {
    constructor();
    /**
     * @param json {string} -- JSON string
     * @returns {Promise<RawGraph>}
     */
    json(json: string): Promise<RawGraph>;
    /**
     * @param url -- JSON file
     * @returns {Promise<RawGraph>}
     */
    jsonFromUrl(url: string): Promise<RawGraph>;
    _initJSON(jsonData: object): RawGraph;
    /**
     * @param response -- Response of the Neo4j Bolt driver.
     *                    doc address: https://neo4j.com/docs/api/javascript-driver/current/
     * @returns {Promise<RawGraph>}
     */
    neo4j(response: object | []): Promise<RawGraph>;
}
