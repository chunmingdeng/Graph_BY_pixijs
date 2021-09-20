import EventEmitter from "eventemitter3";

/**
 * Internal structure to represent node;
 */
function hashCode(str) {
    let hash = 0, i, chr, len;
    if (str.length === 0) return hash;
    for (i = 0, len = str.length; i < len; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

function makeEdgeId(fromId, toId) {
    return hashCode(fromId.toString() + '👉 ' + toId.toString());
}

function Node(id, data = {}, attributes = {}) {
    this.id = id;
    this.edges = null;
    this.data = data;
    this.attributes = attributes;
}

function addEdgeToNode(node, edge) {
    if (node.edges) {
        node.edges.push(edge);
    } else {
        node.edges = [edge];
    }
}

/**
 * Internal structure to represent edges;
 */
class Edge {
    constructor(fromId, toId, data = {}, attributes = {}, id = "") {
        this.fromId = fromId;
        this.toId = toId;
        this.data = data;
        this.attributes = attributes;
        this.id = id;
    }

    getData(value) {
        return this.data[value];
    }

    getAttribute(value) {
        return this.attributes[value];
    }
}

/**
 * Creates a new graph
 */
export default class Graph extends EventEmitter  {
    constructor(options) {
        super();

        // Graph structure is maintained as dictionary of nodes
        // and array of edges. Each node has 'edges' property which
        // hold all edges related to that node. And general edges
        // array is used to speed up all edges enumeration. This is inefficient
        // in terms of memory, but simplifies coding.
        options = options || {};
        if (options.uniqueEdgeId === undefined) {
            // Request each edge id to be unique between same nodes. This negatively
            // impacts `addEdge()` performance (O(n), where n - number of edges of each
            // vertex), but makes operations with multigraphs more accessible.
            options.uniqueEdgeId = true;
        }

        this.nodes = typeof Object.create === 'function' ? Object.create(null) : {};
        this.edges = [];
        // Hash of multi-edges. Used to track ids of edges between same nodes
        this.multiEdges = {};
        this.nodesCount = 0;
        this.suspendEvents = 0,

        /**
         * Invokes callback on each node of the graph.
         *
         * @param {Function(node)} callback Function to be invoked. The function
         *   is passed one argument: visited node.
         */
        this.forEachNode = this.createNodeIterator(),
        this.createEdge = options.uniqueEdgeId ? this.createUniqueEdge : this.createSingleEdge,

        // Our graph API provides means to listen to graph changes. Users can subscribe
        // to be notified about changes in the graph by using `on` method. However
        // in some cases they don't use it. To avoid unnecessary memory consumption
        // we will not record graph changes until we have at least one subscriber.
        // Code below supports this optimization.
        //
        // Accumulates all changes made during graph updates.
        // Each change element contains:
        //  changeType - one of the strings: 'add', 'remove' or 'update';
        //  node - if change is related to node this property is set to changed graph's node;
        //  edge - if change is related to edge this property is set to changed graph's edge;
        this.changes = [];
        this.beginUpdate = this.enterModification;
        this.endUpdate = this.exitModification;
    }

    recordEdgeChange(edge, changeType) {
        this.changes.push({
            edge: edge,
            changeType: changeType
        });
    }

    recordNodeChange(node, changeType) {
        this.changes.push({
            node: node,
            changeType: changeType
        });
    }

    /**
     * Adds node to the graph. If node with given id already exists in the graph
     * its data is extended with whatever comes in 'data' argument.
     *
     * @param {RawNode} rawNode
     *
     * @return {Node} The newly added node or node with given id if it already exists.
     */
    addNode(rawNode) {
        if (rawNode.id === undefined) {
            throw new Error('Invalid node identifier');
        }

        this.enterModification();

        const nodeId = rawNode.id;
        let node = this.getNode(nodeId);
        if (!node) {
            node = new Node(nodeId, rawNode.data, rawNode.attributes);
            this.nodesCount++;
            this.recordNodeChange(node, 'add');
        } else {
            this.recordNodeChange(node, 'update');
        }

        this.nodes[nodeId] = node;

        this.exitModification();
        return node;
    }

    /**
    * Adds nodes to the graph in batch.
    * @param {RawNode[]} rawNodes
    * @returns {Node[]}
    */
    addNodes(rawNodes) {
        const addedNodes = [];

        this.enterModification();

        for (const rawNode of rawNodes) {
            const nodeId = rawNode.id;
            if (nodeId === undefined) {
                console.error('Invalid node identifier');
                continue;
            }

            let node = this.getNode(nodeId);
            if (!node) {
                node = new Node(nodeId, rawNode.data, rawNode.attributes);
                this.nodesCount++;
                this.recordNodeChange(node, 'add');
            } else {
                this.recordNodeChange(node, 'update');
            }

            this.nodes[rawNode.id] = node;
            addedNodes.push(node);
        }

        this.exitModification();

        return addedNodes;
    }

    /**
    * Gets node with given identifier. If node does not exist undefined value is returned.
    *
    * @param nodeId requested node identifier;
    *
    * @return {Node} in with requested identifier or undefined if no such node exists.
    */
    getNode(nodeId) {
        return this.nodes[nodeId];
    }

    /**
     * get all nodes.
     * @returns {Node[]}
     */
    getNodes() {
        return Object.values(this.nodes);
    }

    /**
    * Removes node with given id from the graph. If node does not exist in the graph
    * does nothing.
    *
    * @param nodeId node's identifier passed to addNode() function.
    *
    * @returns {boolean} true if node was removed; false otherwise.
    */
    removeNode(nodeId) {
        const node = this.getNode(nodeId);
        if (!node) {
            return false;
        }

        this.enterModification();

        if (node.edges) {
            while (node.edges.length) {
                const edge = node.edges[0];
                this.removeEdge(edge);
            }
        }

        delete this.nodes[nodeId];
        this.nodesCount--;

        this.recordNodeChange(node, 'remove');

        this.exitModification();

        return true;
    }

    /**
     * Gets number of nodes in this graph.
     *
     * @return {number} number of nodes in the graph.
     */
    getNodesCount() {
        return this.nodesCount;
    }

    /**
    * Adds a edge to the graph. The function always create a new
    * link between two nodes. If one of the nodes does not exists
    * a new node is created.
    * @param {RawEdge} rawEdge
    * @return {Edge} The newly created edge
    */
    addEdge(rawEdge) {
        const fromId = rawEdge.fromId;
        const toId = rawEdge.toId;

        const fromNode = this.getNode(fromId);
        const toNode = this.getNode(toId);
        if (!fromNode || !toNode) {
            console.log(`From node ${fromId} or to node ${toId} not found, please add nodes first.`);
            return;
        }
        this.enterModification();

        const edge = this.createEdge(fromId, toId, rawEdge.data, rawEdge.attributes, rawEdge.id);

        this.edges.push(edge);

        // TODO: this is not cool. On large graphs potentially would consume more memory.
        addEdgeToNode(fromNode, edge);
        if (fromId !== toId) {
            // make sure we are not duplicating edges for self-loops
            addEdgeToNode(toNode, edge);
        }

        this.recordEdgeChange(edge, 'add');

        this.exitModification();

        return edge;
    }

    /**
    * Adds edges to the graph in batch.
    * @param {RawEdge[]} rawEdges
    * @returns {Edge[]}
    */
    addEdges(rawEdges) {
        const addedEdges = [];

        this.enterModification();

        for (const rawEdge of rawEdges) {
            const fromId = rawEdge.fromId;
            const toId = rawEdge.toId;
            const fromNode = this.getNode(fromId);
            const toNode = this.getNode(toId);
            if (!fromNode || !toNode) {
                console.error(`From node ${fromId} or to node ${toId} not found, please add nodes first.`);
                continue;
            }

            const edge = this.createEdge(fromId, toId, rawEdge.data, rawEdge.attributes, rawEdge.id);

            this.edges.push(edge);
            addedEdges.push(edge);

            // TODO: this is not cool. On large graphs potentially would consume more memory.
            addEdgeToNode(fromNode, edge);
            if (fromId !== toId) {
                // make sure we are not duplicating edges for self-loops
                addEdgeToNode(toNode, edge);
            }

            this.recordEdgeChange(edge, 'add');
        }

        this.exitModification();

        return addedEdges;
    }

    createSingleEdge(fromId, toId, data) {
        const edgeId = makeEdgeId(fromId, toId);
        return new Edge(fromId, toId, data, edgeId);
    }

    /**
     * Create a unique edge object.
     * @param fromId
     * @param toId
     * @param data
     * @param attributes
     * @param id
     * @returns {Edge}
     */
    createUniqueEdge(fromId, toId, data, attributes, id) {
        if (id) {
            return new Edge(fromId, toId, data, attributes, id);
        } else {
            // TODO: Get rid of this method.
            let edgeId = makeEdgeId(fromId, toId);
            let isMultiEdge = this.multiEdges.hasOwnProperty(edgeId);
            if (isMultiEdge || this.getEdge(fromId, toId)) {
                if (!isMultiEdge) {
                    this.multiEdges[edgeId] = 0;
                }
                const suffix = '@' + (++this.multiEdges[edgeId]);
                edgeId = makeEdgeId(fromId + suffix, toId + suffix);
            }

            return new Edge(fromId, toId, data, attributes, edgeId);
        }
    }

    /**
     * Gets all edges (inbound and outbound) from the node with given id.
     * If node with given id is not found null is returned.
     * If not given id, return all edges.
     *
     * @param nodeId requested node identifier.
     *
     * @return {Edge[]}Array of edges from and to requested node if such node exists;
     *   otherwise null is returned.
     */
    getEdges(nodeId) {
        if (nodeId == null) return this.edges; // in case nodeId equals zero
        const node = this.getNode(nodeId);
        return node ? node.edges : null;
    }

    /**
     * Removes edge from the graph. If edge does not exist does nothing.
     *
     * @param edge - object returned by addEdge() or getEdges() methods.
     *
     * @returns {boolean} true if edge was removed; false otherwise.
     */
    removeEdge(edge) {
        if (!edge) {
            return false;
        }
        let idx = this.edges.findIndex((e) => e.id === edge.id);
        let edgeTmp = this.edges[idx];
        if (idx < 0) {
            return false;
        }

        this.enterModification();

        this.edges.splice(idx, 1);

        let fromId = edge.fromId;
        let toId = edge.toId;

        let fromNode = this.getNode(fromId);
        let toNode = this.getNode(toId);

        if (fromNode) {
            idx = fromNode.edges.findIndex((e) => e.id === edge.id);
            if (idx >= 0) {
                fromNode.edges.splice(idx, 1);
            }
        }

        if (toNode) {
            idx = toNode.edges.findIndex((e) => e.id === edge.id);
            if (idx >= 0) {
                toNode.edges.splice(idx, 1);
            }
        }

        this.recordEdgeChange(edgeTmp, 'remove');

        this.exitModification();

        return true;
    }

    /**
     * Gets an edge between two nodes.
     * Operation complexity is O(n) where n - number of edges of a node.
     *
     * @param {string} fromNodeId edge start identifier
     * @param {string} toNodeId edge end identifier
     *
     * @returns edge if there is one. null otherwise.
     */
    getEdge(fromNodeId, toNodeId) {
        // TODO: Use sorted edges to speed this up
        const node = this.getNode(fromNodeId);
        if (!node || !node.edges) {
            return null;
        }

        for (let i = 0; i < node.edges.length; ++i) {
            const edge = node.edges[i];
            if (edge.fromId === fromNodeId && edge.toId === toNodeId) {
                return edge;
            }
        }

        return null; // no edge.
    }

    /**
    * Gets total number of edges in the graph.
    */
    getEdgesCount() {
        return this.edges.length;
    }

    /**
     * Removes all nodes and edges from the graph.
     */
    clear() {
        this.enterModification();
        this.forEachNode((node) => {
            this.removeNode(node.id);
        });
        this.exitModification();
    }

    /**
     * Enumerates all edges in the graph
     *
     * @param {Function(edge)} callback Function to be called on all edges in the graph.
     *   The function is passed one parameter: graph's edge object.
     *
     * Edge object contains at least the following fields:
     *  fromId - node id where edge starts;
     *  toId - node id where edge ends,
     *  data - additional data passed to graph.addEdge() method.
     */
    forEachEdge(callback) {
        if (typeof callback === 'function') {
            for (let i = 0, length = this.edges.length; i < length; ++i) {
                callback(this.edges[i]);
            }
        }
    }

    /**
     * Invokes callback on every linked (adjacent) node to the given one.
     *
     * @param nodeId Identifier of the requested node.
     * @param {Function(node, edge)} callback Function to be called on all linked nodes.
     *   The function is passed two parameters: adjacent node and edge object itself.
     * @param oriented if true graph treated as oriented.
     */
    forEachEdgeedNode(nodeId, callback, oriented) {
        const node = this.getNode(nodeId);

        if (node && node.edges && typeof callback === 'function') {
            if (oriented) {
                return this.forEachOrientedEdge(node.edges, nodeId, callback);
            } else {
                return this.forEachNonOrientedEdge(node.edges, nodeId, callback);
            }
        }
    }

    forEachNonOrientedEdge(edges, nodeId, callback) {
        for (let i = 0; i < edges.length; ++i) {
            const edge = edges[i];
            const linkedNodeId = edge.fromId === nodeId ? edge.toId : edge.fromId;

            const quitFast = callback(this.nodes[linkedNodeId], edge);
            if (quitFast) {
                return true; // Client does not need more iterations. Break now.
            }
        }
    }

    forEachOrientedEdge(edges, nodeId, callback) {
        for (let i = 0; i < edges.length; ++i) {
            const edge = edges[i];
            if (edge.fromId === nodeId) {
                const quitFast = callback(this.nodes[edge.toId], edge);
                if (quitFast) {
                    return true; // Client does not need more iterations. Break now.
                }
            }
        }
    }

    // Enter, Exit modification allows bulk graph updates without firing events.
    /**
     * Suspend all notifications about graph changes until
     * endUpdate is called.
     */
    enterModification() {
        this.suspendEvents += 1;
    }

    /**
     * Resumes all notifications about graph changes and fires
     * graph 'changed' event in case there are any pending changes.
     */
    exitModification() {
        this.suspendEvents -= 1;
        if (this.suspendEvents === 0 && this.changes.length > 0) {
            // graphPart.fire('changed', this.changes);
            this.emit('changed', this.changes);
            this.changes.length = 0;
        }
    }

    beginInitUpdate() {
        this.suspendEvents += 1;
    }

    endInitUpdate() {
        this.suspendEvents -= 1;
        if (this.suspendEvents === 0 && this.changes.length > 0) {
            // graphPart.fire('init', changes);
            this.emit('init', this.changes);
            this.changes.length = 0;
        }
    }

    createNodeIterator() {
        // Object.keys iterator is 1.3x faster than `for in` loop.
        // See `https://github.com/anvaka/ngraph.graph/tree/bench-for-in-vs-obj-keys`
        // branch for perf test
        return Object.keys ? this.objectKeysIterator : this.forInIterator;
    }

    objectKeysIterator(callback) {
        if (typeof callback !== 'function') {
            return;
        }

        const keys = Object.keys(this.nodes);
        for (let i = 0; i < keys.length; ++i) {
            if (callback(this.nodes[keys[i]])) {
                return true; // client doesn't want to proceed. Return.
            }
        }
    }

    forInIterator(callback) {
        if (typeof callback !== 'function') {
            return;
        }

        for (let node in this.nodes) {
            if (callback(this.nodes[node])) {
                return true; // client doesn't want to proceed. Return.
            }
        }
    }
}

