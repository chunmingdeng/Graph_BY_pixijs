/**
 * Structure to represent added node;
 * @constructor
 * @param id  the node's identifier. A string or number is preferred.
 * @param [data]  additional data for the node being added. If node already exists its data object is augmented with the new one.
 * @param [attributes] additional attributes style the node.
 */
export class RawNode {
    constructor(id, data = {}, attributes = {}) {
        this.id = id;
        this.data = data;
        this.attributes = attributes;
    }
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
export class RawEdge {
    constructor(id, fromId, toId, data = {}, attributes = {}) {
        this.fromId = fromId;
        this.toId = toId;
        this.data = data;
        this.id = id;
        this.attributes = attributes;
    }
}

/**
 * Structure to represent raw graph;
 * @constructor
 * @param {RawNode[]} nodes
 * @param {RawEdge[]} edges
 */
export class RawGraph {
    constructor(nodes, edges) {
        this.nodes = nodes;
        this.edges = edges;
    }
}
