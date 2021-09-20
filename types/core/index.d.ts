// @ts-ignore
import EventEmitter from 'eventemitter3';
import 'pixi.js';
import { RawNode, RawEdge, RawGraph } from './RawData'
/**
 * The GraphZ's Core Class
 *
 * @class
 * @param {object} [options] - the optional GraphZ parameters
 * @param {string} [options.container] - A HTML DOM element's id in which the graph should be rendered.
 */

// load font resource
interface Resource {
    font: string,
    [propName: string]: any;
}

// node in graph
interface Node {
    id: string,
    edges?: null,
    data?: {},
    attributes?: {}
}

// edge in graph
interface Edge {
    fromId: string,
    toId: string,
    id?: string,
    data?: {},
    attributes?: {}
    getData(value: any): any,
    getAttribute(value:any): any
}


export declare class Core extends EventEmitter {
    constructor(options: object);
    loadResources(resources: Resource): Promise<any>;

    /**
     * Clear the graph, then add the specified nodes and edges to the graph.
     * @param {RawGraph} graph
     */
    setGraph(graph: RawGraph): void;

    clearGraph(): void;

    /**
     * Gets number of nodes in this graph.
     *
     * @return number of nodes in the graph.
     */
    getNodesCount(): number;

    /**
     * Gets total number of edges in the graph.
     * @return number of edges in the graph.
     */
    getEdgesCount(): number;

    /**
     * Gets node with given identifier. If node does not exist undefined value is returned.
     * @param nodeId requested node identifier;
     * @return {Node} in with requested identifier or undefined if no such node exists.
     */
    getNode(nodeId: string): Node | undefined;

    /**
     * Gets an edge between two nodes.
     * Operation complexity is O(n) where n - number of edges of a node.
     * @param {string} fromNodeId edge start identifier
     * @param {string} toNodeId edge end identifier
     *
     * @returns {Edge} edge if there is one. null otherwise.
     */
    getEdge(fromNodeId: string, toNodeId: string): Edge | null;

    /**
     * get all nodes.
     * @return {Node[]}
     */
    getNodes(): Node[] | [];

    /**
     * Gets all edges (inbound and outbound) from the node with given id.
     * @return {Edge[]}Array of edges from and to requested node if such node exists;
     *   otherwise null is returned.
     */
    getEdges(): Edge[] | null;

    /**
     * Removes node with given id from the graph. If node does not exist in the graph
     * does nothing.
     * @param nodeId node's identifier.
     * @returns {boolean} true if node was removed; false otherwise.
     */
    removeNode(nodeId: string): boolean;

    /**
     * Removes edge from the graph. If edge does not exist does nothing.
     * @param edge - object.
     * @returns {boolean} true if edge was removed; false otherwise.
     */
    removeEdge(edge: object): boolean;

    /**
     * Invokes callback on each node of the graph.
     * @param func
     */
    forEachNode(func: Function): any;

    /**
     * Invokes callback on each edge of the graph.
     * @param func
     */
    forEachEdge(func: Function): any;

    beginUpdate(): void;
    endUpdate(): void;

    /**
     * Adds node to the graph. If node with given id already exists in the graph
     * its data is extended with whatever comes in 'data' argument.
     * @param {RawNode} rawNode
     * @return {Node} The newly added node or node with given id if it already exists.
     */
    addNode(rawNode: RawNode): Node;

    /**
     * Adds nodes to the graph in batch.
     * @param {RawNode[]} rawNodes
     * @returns {Node[]}
     */
    addNodes(rawNodes: RawNode[]): Node[];

    /**
     * Adds a edge to the graph. The function always create a new
     * link between two nodes. If one of the nodes does not exists
     * a new node is created.
     * @param {RawEdge} rawEdge
     * @return {Edge} The newly created edge
     */
    addEdge(rawEdge: RawEdge): Edge;

    /**
     * Adds edges to the graph in batch.
     * @param {RawEdge[]} rawEdges
     * @returns {Edge[]}
     */
    addEdges(rawEdges: RawEdge[]): Edge[];

    /**
     * Allow switching between picking and panning modes.
     */
    setMode(newMode: 'picking' | 'panning' | 'connecting'): 'picking' | 'panning' | 'connecting';


    /**
     * toggle mode between picking and panning.
     */
    toggleMode(): 'picking' | 'panning';

    /**
     * check the specific mode.
     */
    pickingMode(): 'picking';
    panningMode(): 'panning';
    connectingMode(): 'connecting';

    /**
     * get selected nodes,
     * nodes of nodeContainer are selected
     */
    getSelectedNodes(): any;

    /**
     * get selected Links,
     * edges of nodeContainer are selected
     */
    getSelectedLinks(): any;

    /**
     * set actual size of layout
     */
    setActualSize(): void;

    /**
     * This method is to move the graph scene center to the specified position
     * @param canvasX {number}
     * @param canvasY {number}
     */
    alignContentCenterToCanvasPosition(canvasX: number, canvasY: number): void;

    /**
     * Centers the view on the graph.
     */
    setNodesToFullScreen(): void;

    setSelectedNodesToFullScreen(): void;

    /**
     * unselected the specific nodes and edges.
     * @param nodeIdArray {Array}
     * @param edgeIdArray {Array}
     */
    unSelectSubGraph(nodeIdArray: [], edgeIdArray: []): void;

    /**
     * selected the specific nodes and edges.
     * @param nodeIdArray {Array}
     * @param edgeIdArray {Array}
     */
    selectSubGraph(nodeIdArray: [], edgeIdArray: []): void;

    /**
     * clear all selected nodes and edges.
     */
    clearSelection(): void;

    /**
     * 选中指定node集合所对应的链接，默认两端都选中
     * @param startingNodes {Array}
     * @param direction {'both' | 'in' | 'out'} - 'both'
     * @param alsoSelectNodes {boolean} - false
     */
    selectLinksFromNodes(startingNodes: [], direction: 'both' | 'in' | 'out', alsoSelectNodes: boolean): void;

    /**
     * 选中指定edge集合所连接的实体
     * @param selectedEdges {Array}
     */
    selectNodesOfLinks(selectedEdges: []): void;

    /**
     * 选择端点和链接
     * @param {[]} selectedNodes nodeSprite
     * @param {[]} selectedLinks edgeSprite
     */
    selectNodesAndLinks(selectedNodes: [], selectedLinks: []): void;

    /**
     * select all nodes and edges.
     */
    selectAll(): void;

    /**
     * Reverse selection.
     */
    selectReverseSelection(): void;

    /**
     * 放大与缩小
     */
    zoomIn(): void;
    zoomOut(): void;

    /**
     * 力导向布局
     */
    force(): Promise<any>;

    /**
     * WASM方式实现的布局
     */
    WASMLayout(wasmType: any): any;

    /**
     * 圆形布局
     */
    circle(): any;

    /**
     * 辐射布局
     */
    radiate(): any;

    /**
     * 结构布局
     */
    structural(): any;

    /**
     * 层次布局
     */
    layered(): any;

    /**
     * convert the canvas drawing buffer into base64 encoded image url
     * @param width {number}
     * @param height {number}
     * @param clip {boolean}
     */
    exportImage(width: number, height: number, clip?: boolean):  Promise<any>;

    lock(nodes: any): void;

    unlock(nodes: any): void;

    resize(width: number, height: number): void;

    /**
     * 左对齐
     * @param nodes nodeSprite
     */
    alignLeft(nodes: []): void;

    /**
     * 右对齐
     * @param nodes nodeSprite
     */
    alignRight(nodes: []): void;

    /**
     * 水平对齐
     * @param nodes nodeSprite
     */
    alignHorizontal(nodes: []): void;

    /**
     * 垂直对齐
     * @param nodes nodeSprite
     */
    alignVertical(nodes: []): void;

    /**
     * 顶端对齐
     * @param nodes nodeSprite
     */
    alignTop(nodes: []): void;

    /**
     * 底端对齐
     * @param nodes nodeSprite
     */
    alignBottom(nodes: []): void;

    /**
     * 横向分布
     * @param nodes nodeSprite
     */
    horizontalDistribution(nodes: []): void;

    /**
     * 纵向分布
     * @param nodes nodeSprite
     */
    verticalDistribution(nodes: []): void;

    /**
     * 向四周移动
     * @param nodes
     * @param direction
     */
    move(nodes: [], direction: 'up' | 'right' | 'down' | 'left'): void;

    /**
     * Add a style rule, applying the specified attributes to all nodes & edges that match the specified selector.
     * The style of a node is re-computed when its degree or data changes, and automatically assigned when a node is added.
     * Rules are applied one after another. The latest added rule is applied last.
     * Rules are applied before attributes assigned through setAttributes, which are applied before classes.
     * @param options
     */
    addRule(options: any): void;

    /**
     * Returns the list of all rules, in the order they are applied.
     */
    getRuleList(): any;

    destroy(): void;
}
