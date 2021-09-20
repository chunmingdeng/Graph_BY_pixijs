/**
 * Structure to represent added node;
 * @constructor
 * @param id  the node's identifier. A string or number is preferred.
 * @param [data]  additional data for the node being added. If node already exists its data object is augmented with the new one.
 * @param [attributes] additional attributes style the node.
 */
export declare class RawNode {
    constructor(id: string, data?: {}, attributes?: {});
}
/**
 * Structure to represent added link;
 * @constructor
 * @param fromId
 * @param toId
 * @param data
 * @param id
 * @param attributes
 */
export declare class RawEdge {
    constructor(id: string, fromId: string, toId: string, data?: {}, attributes?: {});
}
/**
 * Structure to represent raw graph;
 * @constructor
 * @param {RawNode[]} nodes
 * @param {RawEdge[]} edges
 */
export declare class RawGraph {
    constructor(nodes: RawNode[], edges: RawEdge[]);
}
