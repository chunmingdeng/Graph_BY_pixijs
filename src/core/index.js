import EventEmitter from 'eventemitter3';
import 'pixi.js';

import Graph from './Graph';
import visualConfig from "./visualConfig";

import WebGLRenderer from './renderers/webgl';

/**
 * The GraphZ's Core Class
 *
 * @class
 * @param {object} [options] - the optional GraphZ parameters
 * @param {string} [options.container] - A HTML DOM element's id in which the graph should be rendered.
 */
export default class Core extends EventEmitter {
    constructor(options) {
        super();

        this.events = new EventEmitter();

        options.visualConfig = Object.assign({}, visualConfig, options.visualConfig);
        this.visualConfig = options.visualConfig;

        /**
         * The Inner Graph Object.
         * @member {Graph}
         */
        this.graph = new Graph();

        this.renderer = new WebGLRenderer(options, this.graph, this.events);
    }

    loadResources(resources) {
        return new Promise((resolve => {
            const loader = new PIXI.loaders.Loader();
            loader.add('fontXML', resources.font);
            loader.load((loader, resources) => {
                this.visualConfig.font = resources.fontXML.bitmapFont;
                resolve();
            });
        }));
    }

    /**
     * Clear the graph, then add the specified nodes and edges to the graph.
     * @param {RawGraph} graph
     */
    setGraph(graph) {
        this.graph.clear();
        this.graph.addNodes(graph.nodes);
        this.graph.addEdges(graph.edges);
    }
    clearGraph() {
        this.graph.clear();
    }

    getNodesCount() {
        return this.graph.getNodesCount();
    }
    getEdgesCount() {
        return this.graph.getEdgesCount();
    }

    getNode(nodeId) {
        return this.graph.getNode(nodeId);
    }
    getEdge(fromNodeId, toNodeId) {
        return this.graph.getEdge(fromNodeId, toNodeId);
    }

    getNodes() {
        return this.graph.getNodes();
    }
    getEdges() {
        return this.graph.getEdges();
    }

    removeNode(node) {
        return this.graph.removeNode(node);
    }
    removeEdge(edge) {
        return this.graph.removeEdge(edge);
    }

    forEachNode(func) {
        return this.graph.forEachNode(func);
    }
    forEachEdge(func) {
        return this.graph.forEachEdge(func);
    }

    beginUpdate() {
        return this.graph.beginUpdate();
    }
    endUpdate() {
        return this.graph.endUpdate();
    }

    addNode(rawNode) {
        return this.graph.addNode(rawNode);
    }
    addNodes(rawNodes) {
        return this.graph.addNodes(rawNodes);
    }

    addEdge(rawEdge) {
        return this.graph.addEdge(rawEdge);
    }
    addEdges(rawEdges) {
        return this.graph.addEdges(rawEdges);
    }

    /**
     * Allow switching between picking and panning modes;
     */
    setMode(newMode) {
        return this.renderer.setMode(newMode);
    }
    toggleMode() {
        return this.renderer.toggleMode();
    }
    pickingMode() {
        return this.renderer.pickingMode();
    }
    panningMode() {
        return this.renderer.panningMode();
    }
    connectingMode() {
        return this.renderer.connectingMode();
    }

    /**
     * get selected nodes,
     * nodes of nodeContainer are selected
     */
    getSelectedNodes() {
        return this.renderer.getSelectedNodes();
    }

    /**
     * get selected Links,
     * edges of nodeContainer are selected
     */
    getSelectedLinks() {
        return this.renderer.getSelectedLinks();
    }

    /**
     * set actual size of layout
     */
    setActualSize() {
        this.renderer.setActualSize();
    }

    // This method is to move the graph scene center to the specified postion
    alignContentCenterToCanvasPosition(canvasX, canvasY) {
        // actually I prefer refresh manually
        this.renderer.alignContentCenterToCanvasPosition(canvasX, canvasY);
    }

    /**
     * Centers the view on the graph.
     */
    setNodesToFullScreen() {
        this.renderer.setNodesToFullScreen();
    }

    /**
     * FIXME, performance issue, updating all nodes, which is not necessary
     */
    setSelectedNodesToFullScreen() {
        this.renderer.setSelectedNodesToFullScreen();
    }

    unSelectSubGraph(nodeIdArray, edgeIdArray) {
        this.renderer.unSelectSubGraph(nodeIdArray, edgeIdArray);
    }

    selectSubGraph(nodeIdArray, edgeIdArray) {
        this.renderer.selectSubGraph(nodeIdArray, edgeIdArray);
    }

    clearSelection() {
        this.renderer.clearSelection();
    }

    selectLinksFromNodes(startingNodes, direction, alsoSelectNodes) {
        this.renderer.selectLinksFromNodes(startingNodes, direction, alsoSelectNodes);
    }

    selectNodesOfLinks(selectedEdges) {
        this.renderer.selectNodesOfLinks(selectedEdges);
    }

    /**
     * 选择端点和链接
     * @param {[]} selectedNodes nodeSprite
     * @param {[]} selectedLinks edgeSprite
     */
    selectNodesAndLinks(selectedNodes, selectedLinks) {
        this.renderer.selectNodesAndLinks(selectedNodes, selectedLinks);
    }

    selectAll() {
        this.renderer.selectAll();
    }

    selectReverseSelection() {
        this.renderer.selectReverseSelection();
    }

    zoomIn() {
        this.renderer.zoomIn();
    }

    zoomOut() {
        this.renderer.zoomOut();
    }

    /**
     * 力导向布局
     */
    async force() {
        return this.renderer.force();
    }

    /**
     * WASM方式实现的布局
     */
    WASMLayout(wasmType) {
        return this.renderer.WASMLayout(wasmType);
    }

    /**
     * 圆形布局
     */
    circle() {
        return this.renderer.circle();
    }

    /**
     * 辐射布局
     */
    radiate() {
        return this.renderer.radiate();
    }

    /**
     * 结构布局
     */
    structural() {
        return this.renderer.structural();
    }

    /**
     * 层次布局
     */
    layered() {
        return this.renderer.layered();
    }

    /*setTwoNodeLayoutInXDireaction(nodeIDArray) {
        this.renderer.setTwoNodeLayoutInXDireaction(nodeIDArray);
    }*/

    // convert the canvas drawing buffer into base64 encoded image url
    exportImage(width, height) {
        return this.renderer.exportImage(width, height);
    }

    lock(nodes) {
        this.renderer.lock(nodes);
    }

    unlock(nodes) {
        this.renderer.unlock(nodes);
    }

    resize(width, height) {
        this.renderer.resize(width, height);
    }

    /**
     * 左对齐
     * @param {[NodeSprite]} nodes nodeSprite
     */
    alignLeft(nodes) {
        this.renderer.alignLeft(nodes);
    }

    /**
     * 右对齐
     * @param {[NodeSprite]} nodes nodeSprite
     */
    alignRight(nodes) {
        this.renderer.alignRight(nodes);
    }

    /**
     * 水平对齐
     * @param {[NodeSprite]} nodes nodeSprite
     */
    alignHorizontal(nodes) {
        this.renderer.alignHorizontal(nodes);
    }

    /**
     * 垂直对齐
     * @param {[NodeSprite]} nodes nodeSprite
     */
    alignVertical(nodes) {
        this.renderer.alignVertical(nodes);
    }

    /**
     * 顶端对齐
     * @param {[NodeSprite]} nodes nodeSprite
     */
    alignTop(nodes) {
        this.renderer.alignTop(nodes);
    }

    /**
     * 底端对齐
     * @param {[NodeSprite]} nodes nodeSprite
     */
    alignBottom(nodes) {
        this.renderer.alignBottom(nodes);
    }

    /**
     * 横向分布
     * @param {[NodeSprite]} nodes nodeSprite
     */
    horizontalDistribution(nodes) {
        this.renderer.horizontalDistribution(nodes);
    }

    /**
     * 纵向分布
     * @param {[NodeSprite]} nodes nodeSprite
     */
    verticalDistribution(nodes) {
        this.renderer.verticalDistribution(nodes);
    }

    /**
     * 向四周移动
     * @param nodes
     * @param direction
     */
    move(nodes, direction) {
        this.renderer.move(nodes, direction);
    }

    /**
     * Add a style rule, applying the specified attributes to all nodes & edges that match the specified selector.
     * The style of a node is re-computed when its degree or data changes, and automatically assigned when a node is added.
     * Rules are applied one after another. The latest added rule is applied last.
     * Rules are applied before attributes assigned through setAttributes, which are applied before classes.
     * @param options
     */
    addRule(options) {
        this.renderer.addRule(options);
    }

    /**
     * Returns the list of all rules, in the order they are applied.
     */
    getRuleList() {
        return this.renderer.styleRules;
    }

    destroy() {
        this.renderer.destroy();
    }
}
