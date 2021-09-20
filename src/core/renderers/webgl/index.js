import EventEmitter from 'eventemitter3';

import 'pixi.js';

import NodeContainer from "./node/NodeContainer";
import EdgeContainer from "./edge/EdgeContainer";
import StageContainer from "./StageContainer";

import NodeSprite from "./sprite/NodeSprite";
import EdgeSprite from "./sprite/EdgeSprite";

import PresetLayout from "../../layout/PresetLayout/PresetLayout";
import ForceLayout from "../../layout/ForceLayout/ForceLayout";
import WASMGenerator from "../../layout/WASMLayout/WASMGenerator";
import CircleLayout from "../../layout/CircleLayout/CircleLayout";
import RadiateLayout from "../../layout/RadiateLayout/RadiateLayout";
import StructuralLayout from "../../layout/StructuralLayout/StructuralLayout";
import LayeredLayout from "../../layout/LayeredLayout/LayeredLayout";

import AnimationAgent from "./utils/AnimationAgent";
import { getMyBounds } from "./utils/boundsHelper";
import FPSCounter from "./utils/FPSCounter";
import extract from "./utils/extract";

export default class WebGLRenderer extends EventEmitter {
    constructor(options, graph, events) {
        super();

        this.graph = graph;

        this.events = events;

        /**
         * nodeSprites is for all of the nodes, their attribute can be found in {@link NodeSprite};
         * @member {Object.<string, NodeSprite>}
         */
        this.nodeSprites = {};
        /**
         * edgeSprites is for all of the edges, their attribute can be found in {@link EdgeSprite};
         * @member {Object.<string, EdgeSprite>}
         */
        this.edgeSprites = {};

        this.styleRules = [];
        this.visualConfig = options.visualConfig;

        // init the canvas
        const canvas = document.createElement('canvas');
        canvas.style['user-select'] = 'none';
        canvas.style['outline-style'] = 'none';
        const canvasContainer = document.getElementById(options.container);
        canvasContainer.appendChild(canvas);

        this.viewWidth = canvasContainer.clientWidth;
        this.viewHeight = canvasContainer.clientHeight;

        this.renderer = new PIXI.autoDetectRenderer(this.viewWidth, this.viewHeight, {
            view: canvas,
            transparent: false,
            autoResize: true,
            antialias: true,
            forceFXAA: false,
            preserveDrawingBuffer: true,
        });

        // 所有node的容器
        this.nodeContainer = new NodeContainer(this.renderer, this.styleRules);
        // node边框容器
        this.borderContainer = new PIXI.Container();
        // 标签容器
        this.labelContainer = new PIXI.Container();

        // 所有连线容器
        this.edgeContainer = new EdgeContainer(this.styleRules);
        // node角标容器
        this.iconContainer = new PIXI.Container();

        // the content root
        this.root = new PIXI.Container();
        this.root.width = this.viewWidth;
        this.root.height = this.viewHeight;

        this.root.addChild(this.edgeContainer);
        this.root.addChild(this.labelContainer);
        this.root.addChild(this.nodeContainer);
        this.root.addChild(this.borderContainer);
        this.root.addChild(this.iconContainer);

        // TODO here set the canvas as 20000*20000
        this.root.hitArea = new PIXI.Rectangle(-1000000, -1000000, 2000000, 2000000);
        this.root.interactive = true;

        // 矩形选择框图形
        this.selectRegionGraphics = new PIXI.Graphics();
        // 连线图形
        this.connectLineGraphics = new PIXI.Graphics();

        // the view port, same size as canvas, used to capture mouse action
        this.stage = new StageContainer(this.nodeSprites, this.edgeSprites, this.nodeContainer, this.edgeContainer, canvasContainer, this.root, this.events);
        this.stage.addChild(this.selectRegionGraphics);
        this.stage.addChild(this.connectLineGraphics);

        this.stage.addChild(this.root);

        this.stage.hitArea = new PIXI.Rectangle(0, 0, this.viewWidth, this.viewHeight);
        this.stage.interactive = true;
        this.stage.width = this.viewWidth;
        this.stage.height = this.viewHeight;

        this.renderer.backgroundColor = this.visualConfig.backgroundColor;

        this.nodeContainer.on('nodeCaptured', (node) => {
            this.stage.hasNodeCaptured = true;
            if (!node.pinned) {
                this.layout.pinNode(node, true);
            }
        });

        this.nodeContainer.on('nodeReleased', (node) => {
            this.stage.hasNodeCaptured = false;
            if (node.pinned && !node.attributes._$lock) {
                node.pinned = false;
                this.layout.pinNode(node, false);
            } else {
                node.pinned = true;
            }
        });

        this.counter = new FPSCounter();

        this.layout = new PresetLayout(this.nodeSprites, this.nodeContainer);

        // add animation
        this.animationAgent = new AnimationAgent();

        this.graph.on('init', this.onGraphInit.bind(this));
        this.graph.on('changed', this.onGraphChanged.bind(this));
        this.graph.on('texture', this.onGraphTextureUpdate.bind(this));

        this.runAnimationLoop();
    }

    selectionChanged() {
        this.emit('selectionChanged');
    }

    onGraphTextureUpdate(changes) {
        _.each(changes, (c)=>{
            if(c.node) {
                const nodeSprite = this.nodeSprites[c.node.id];

                nodeSprite.updateLabel();

                nodeSprite.isUnknown = nodeSprite.attributes._$unknown || nodeSprite.attributes._$lazy;
                if (nodeSprite.isUnknown) {
                    nodeSprite.setNodeUnknownIcon();
                } else {
                    nodeSprite.removeNodeUnknownIcon();
                }
            }
        });
    }

    /**
     * 更新是否显示Label
     */
    updateLabelVisibility() {
        if (this.root.scale.x > 0.5) {
            this.labelContainer.visible = true;

            let topLeft = this.root.worldTransform.applyInverse({x: 0, y: 0});
            let bottomRight = this.root.worldTransform.applyInverse({x: this.viewWidth, y: this.viewHeight});
            // simple render children!
            for (const nodeId in this.nodeSprites)
            {
                const node = this.nodeSprites[nodeId];
                node.label.visible = topLeft.x < node.x && node.x < bottomRight.x && topLeft.y < node.y && node.y < bottomRight.y;
            }
            for (const linkId in this.edgeSprites)
            {
                const link = this.edgeSprites[linkId];
                const midX = (link.fx + link.tx) / 2;
                const midY = (link.fy + link.ty) / 2;
                link.label.visible = topLeft.x < midX && midX < bottomRight.x && topLeft.y < midY && midY < bottomRight.y
            }
        } else {
            this.labelContainer.visible = false;
        }
    }

    initNode(p) {
        const nodeSprite = new NodeSprite(p, this.visualConfig, this.labelContainer, this.iconContainer, this.borderContainer, this.styleRules);

        nodeSprite.setAttributes();

        this.nodeContainer.addChild(nodeSprite);
        this.nodeSprites[p.id] = nodeSprite;
    }

    adjustControlOffsets(edgeSpriteArray, arrangeOnBothSides, avoidZero) {
        const linkCount = edgeSpriteArray.length;
        let start = 0;
        let end = linkCount + start;

        if (arrangeOnBothSides) {
            start = -Math.floor(linkCount / 2);
            end = linkCount + start;
        } else {
            if (avoidZero) {
                start = 1;
                end = linkCount + start;
            }
        }
        const controlOffsets = _.range(start, end);
        for (let i = 0; i < edgeSpriteArray.length; i++) {
            const l = edgeSpriteArray[i];
            l.controlOffsetIndex = controlOffsets[i];
        }
    }

    initEdge(f) {
        const srcNodeSprite = this.nodeSprites[f.fromId];
        const tgtNodeSprite = this.nodeSprites[f.toId];
        const sameTgtLink = [];
        const reverseLink = [];
        _.each(srcNodeSprite.outgoing, (edge) => {
            if (edge.toId === f.toId) {
                sameTgtLink.push(edge);
            }
        });
        _.each(tgtNodeSprite.outgoing, (edge) => {
            if (edge.toId === f.fromId) {
                reverseLink.push(edge);
            }
        });

        const l = new EdgeSprite(f, this.visualConfig,
            srcNodeSprite.position.x, srcNodeSprite.position.y,
            tgtNodeSprite.position.x, tgtNodeSprite.position.y,
            this.labelContainer, this.styleRules);
        if (sameTgtLink.length > 0 && reverseLink.length === 0) {
            sameTgtLink.push(l);
            this.adjustControlOffsets(sameTgtLink, true);
        } else if (reverseLink.length > 0 && sameTgtLink.length === 0) {
            this.adjustControlOffsets(reverseLink, false, true);
            sameTgtLink.push(l);
            this.adjustControlOffsets(sameTgtLink, false, true);
        } else if (reverseLink.length > 0 && sameTgtLink.length > 0) {
            this.adjustControlOffsets(reverseLink, false, true);
            sameTgtLink.push(l);
            this.adjustControlOffsets(sameTgtLink, false, true);
        }

        srcNodeSprite.outgoing.push(l);
        tgtNodeSprite.incoming.push(l);
        this.edgeSprites[l.id] = l;

        this.edgeContainer.addChild(l);
        l.parent = this.edgeContainer;
    }

    removeNode(node) {
        const nodeSprite = this.nodeSprites[node.id];
        if (nodeSprite) {
            this.nodeContainer.removeChild(nodeSprite);
            delete this.nodeSprites[node.id];
            nodeSprite.destroy();
        } else {
            console.log(`Could not find node sprite:${node.id}`);
        }
    }

    removeLink(link) {
        const edgeSprite = this.edgeSprites[link.id];
        if (edgeSprite) {
            const srcEntitySprite = this.nodeSprites[edgeSprite.fromId];
            const tgtEntitySprite = this.nodeSprites[edgeSprite.toId];
            const outLinkIndex = srcEntitySprite.outgoing.indexOf(edgeSprite);
            if (outLinkIndex >= 0) {
                srcEntitySprite.outgoing.splice(outLinkIndex, 1);
            }
            const inLinkIndex = tgtEntitySprite.incoming.indexOf(edgeSprite);
            if (inLinkIndex >= 0) {
                tgtEntitySprite.incoming.splice(inLinkIndex, 1);
            }

            this.edgeContainer.removeLink(edgeSprite);
            delete this.edgeSprites[edgeSprite.id];
            edgeSprite.destroy();
        } else {
            console.log(`Could not find link sprite: ${link.id}`);
        }
    }

    updateNode(node) {
        const nodeSprite = this.nodeSprites[node.id];
        nodeSprite.data = node.data;
        nodeSprite.updateLabel();
        // nodeSprite.updateBorder();
        nodeSprite.setAttributes();
        this.nodeContainer.updateScale(nodeSprite);
    }

    updateLink(link) {
        const edgeSprite = this.edgeSprites[link.id];
        edgeSprite.data = link.data;
        edgeSprite.updateLabel();
        this.edgeContainer.updateLineWidth(edgeSprite);
        this.edgeContainer.updateColor(edgeSprite);
    }

    onGraphChanged(changes) {
        console.log(`Graph changed ${new Date()}`);
        for (let i = 0; i < changes.length; ++i) {
            const change = changes[i];
            const changeNode = change.node;
            const changeLink = change.edge;
            if (change.changeType === 'add') {
                if (changeNode) {
                    this.initNode(changeNode);
                }
                if (changeLink) {
                    this.initEdge(changeLink);
                }
            } else if (change.changeType === 'remove') {
                if (changeNode) {
                    this.removeNode(changeNode);
                }
                if (changeLink) {
                    this.removeLink(changeLink);
                }
            } else if (change.changeType === 'update') {
                if (changeNode) {
                    this.updateNode(changeNode);
                }
                if (changeLink) {
                    this.updateLink(changeLink);
                }
            }
        }

        this.setNodesToFullScreen(false);

        console.log(`Graph change process complete ${new Date()}`);
    }

    onGraphInit(changes) {
        for (let i = 0; i < changes.length; ++i) {
            const change = changes[i];
            if (change.changeType === 'add') {
                if (change.node) {
                    this.initNode(change.node);
                }
                if (change.link) {
                    this.initEdge(change.edge);
                }
            }
        }
    }

    drawSelectionRegion() {
        const frameCfg = this.visualConfig.ui.frame;
        this.selectRegionGraphics.lineStyle(frameCfg.border.width, frameCfg.border.color, frameCfg.border.alpha);
        this.selectRegionGraphics.beginFill(frameCfg.fill.color, frameCfg.fill.alpha);
        const width = this.stage.selectRegion.x2 - this.stage.selectRegion.x1;
        const height = this.stage.selectRegion.y2 - this.stage.selectRegion.y1;
        const x = this.stage.selectRegion.x1;
        const y = this.stage.selectRegion.y1;
        this.selectRegionGraphics.drawRect(x, y, width, height);
    }

    drawConnectionLine() {
        const frameCfg = this.visualConfig.ui.frame;
        this.connectLineGraphics.lineStyle(frameCfg.border.width, frameCfg.border.color, frameCfg.border.alpha);
        this.connectLineGraphics.beginFill(frameCfg.fill.color, frameCfg.fill.alpha);
        this.connectLineGraphics.moveTo(this.stage.connectLine.x1, this.stage.connectLine.y1);
        this.connectLineGraphics.lineTo(this.stage.connectLine.x2, this.stage.connectLine.y2);
    }

    /**
     * Allows client to start animation loop, without worrying about RAF stuff.
     */
    runAnimationLoop() {
        const self = this;
        let lastScanTime = 0;
        function animationLoop(now) {
            self.animationAgent.step();

            // Every 0.5 second, we check whether to change label's visible property.
            if (now - lastScanTime > 1000) {
                lastScanTime = now;
                self.updateLabelVisibility();
            }

            self.selectRegionGraphics.clear();
            if (self.stage.selectRegion && self.stage.selectingArea) {
                self.drawSelectionRegion();
            }

            self.connectLineGraphics.clear();
            if (self.stage.connectLine && self.stage.connectingLine) {
                self.drawConnectionLine();
            }

            self.renderer.render(self.stage);

            self.counter.nextFrame();
            requestAnimationFrame(animationLoop);
        }
        requestAnimationFrame(animationLoop);
    }

    /**
     * Allow switching between picking and panning modes;
     */
    setMode(newMode) {
        if (this.mode !== newMode) {
            if (newMode === 'picking') {
                this.mode = 'picking';
                this.stage.buttonMode = false;
                this.stage.mode = this.mode;
                this.root.interactiveChildren = true;
                this.root.interactive = true;
                this.root.cursor = 'default';
            } else if (newMode === 'panning'){
                this.mode = 'panning';
                this.stage.buttonMode = true;
                this.stage.mode = this.mode;
                this.stage.interactive = true;
                this.stage.cursor = 'grab';
                this.root.interactiveChildren = false;
                this.root.interactive = true;
                this.root.cursor = 'grab';
            } else if (newMode === 'connecting') {
                this.mode = 'connecting';
                this.stage.buttonMode = true;
                this.stage.mode = this.mode;
                this.stage.interactive = true;
                this.stage.cursor = 'crosshair';
                this.root.interactiveChildren = false;
                this.root.interactive = true;
                this.root.cursor = 'crosshair';
            }
        }

        return this.mode;
    }

    toggleMode() {
        if (this.mode === 'panning' || this.mode === 'connecting') {
            return this.setMode('picking');
        } else {
            return this.setMode('panning');
        }
    }

    pickingMode() {
        return this.setMode('picking');
    }

    panningMode() {
        return this.setMode('panning');
    }

    connectingMode() {
        return this.setMode('connecting');
    }

    /**
     * get selected nodes,
     * nodes of nodeContainer are selected
     */
    getSelectedNodes() {
        return this.nodeContainer.nodes;
    }

    /**
     * get selected Links,
     * links of nodeContainer are selected
     */
    getSelectedLinks() {
        return this.edgeContainer.links;
    }

    /**
     * set actual size of layout
     */
    setActualSize() {
        const root = this.root;
        root.scale.x = 1;
        root.scale.y = 1;

        const rootPlacement = this.calculateRootPosition(1);
        if (rootPlacement) {
            this.animationAgent.move(this.root, rootPlacement.position);
        } else {
            console.error('Center graph action not supported in current layout.');
        }
    }

    // This method is to move the graph scene center to the specified postion
    alignContentCenterToCanvasPosition(canvasX, canvasY) {
        // actually I prefer refresh manually
        const rect = getMyBounds.call(this.root);
        const graphCenterInStage = {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
        };
        const rootPositionTransform = {
            x: canvasX - graphCenterInStage.x,
            y: canvasY - graphCenterInStage.y,
        };
        // sometimes you may need a smooth move
        // this.animationAgent.move(root, {
        //     x: root.position.x + rootPositionTransform.x,
        //     y: root.position.y + rootPositionTransform.y,
        // });
        this.root.position.x += rootPositionTransform.x;
        this.root.position.y += rootPositionTransform.y;
    }

    getMyBoundsWrap() {
        return getMyBounds.call(this.root);
    }

    calculateRootPosition(scaleFactor) {
        const root = this.root;
        const graphRect = this.layout.getGraphRect();
        if (!graphRect) {
            console.error('No valid graph rectangle available from layout algorithm');
            return null;
        }
        const targetRectWidth = this.viewWidth * 0.8;
        const targetRectHeight = this.viewHeight * 0.65;
        // console.info("Target rectange to place graph", {x: targetRectWidth, y: targetRectHeight});
        const rootWidth = Math.abs(graphRect.x2 - graphRect.x1);
        const rootHeight = Math.abs(graphRect.y1 - graphRect.y2);
        const scaleX = targetRectWidth / rootWidth;
        const scaleY = targetRectHeight / rootHeight;
        // the actuall scale that should be applied to root so that it will fit into the target rectangle
        const scale = Math.min(scaleX, scaleY, scaleFactor);
        const graphCenterInStage = {
            //(graphRect.x1 + rootWidth / 2 ) 是contentRoot坐标系，转换到stage的坐标系时需要进行scale处理， 下同
            x: (graphRect.x1 + rootWidth / 2) * scale + root.position.x,
            y: (graphRect.y1 + rootHeight / 2) * scale + root.position.y,
        };
        const rootPositionTransform = {
            x: this.viewWidth / 2 - graphCenterInStage.x,
            y: this.viewHeight / 2 - graphCenterInStage.y,
        };
        // console.log("Root transform", rootPositionTransform);
        return {
            scale: {
                x: scale,
                y: scale,
            },
            position: {
                x: root.position.x + rootPositionTransform.x,
                y: root.position.y + rootPositionTransform.y,
            },
        };
    }

    /**
     * Centers the view on the graph.
     * @param disableAnimation
     */
    setNodesToFullScreen(disableAnimation) {
        const rootPlacement = this.calculateRootPosition(1);
        if (rootPlacement) {
            // console.log("Root target position: ", rootPlacement.position);
            // console.log("Root target scale: ", rootPlacement.scale);
            if (rootPlacement.scale.x > 1 || rootPlacement.scale.y > 1) {
                this.root.scale.x = 1;
                this.root.scale.y = 1;
            } else {
                this.root.scale.x = rootPlacement.scale.x;
                this.root.scale.y = rootPlacement.scale.y;
            }
            // if (disableAnimation) {
            if (rootPlacement.scale.x > 1 || rootPlacement.scale.y > 1) {
                this.root.scale.x = 1;
                this.root.scale.y = 1;
                rootPlacement.position.x /= rootPlacement.scale.x;
                rootPlacement.position.y /= rootPlacement.scale.y;
            }
            this.root.position.x = rootPlacement.position.x;
            this.root.position.y = rootPlacement.position.y;
            // } else {
            //     this.animationAgent.move(root, rootPlacement.position);
            // }
        } else {
            console.error('Center graph action not supported in current layout.');
        }
    }

    /**
     * FIXME, performance issue, updating all nodes, which is not necessary
     */
    setSelectedNodesToFullScreen() {
        const root = this.root;
        let x1 = -1000000;
        let y1;
        let x2;
        let y2;
        let sumx = 0;
        let sumy = 0;
        let count = 0;
        this.nodeContainer.selectedNodes.forEach((n) => {
            sumx += n.position.x;
            sumy += n.position.y;
            count++;
            if (x1 === -1000000) {
                x1 = n.position.x;
                y1 = n.position.y;
                x2 = n.position.x;
                y2 = n.position.y;
            } else {
                if (n.position.x < x1) {
                    x1 = n.position.x;
                }
                if (n.position.x > x2) {
                    x2 = n.position.x;
                }
                if (n.position.y > y1) {
                    y1 = n.position.y;
                }
                if (n.position.y < y2) {
                    y2 = n.position.y;
                }
            }
        });

        if (count !== 0) {
            sumx /= count;
            sumy /= count;
        } else {
            console.log('no nodes selected!');
            return;
        }
        const rootWidth = Math.abs(x2 - x1);
        const rootHeight = Math.abs(y1 - y2);
        let xScale;
        let yScale;
        xScale = this.visualConfig.MAX_ADJUST;
        yScale = this.visualConfig.MAX_ADJUST;
        if (rootHeight !== 0) {
            let border;
            if (this.viewHeight / rootHeight > 10) {
                border = 500;
            } else {
                border = (this.viewHeight / rootHeight) * 50;
            }
            yScale = (this.viewHeight - border) / rootHeight;
        }
        if (rootWidth !== 0) {
            let border0;
            if (this.viewWidth / rootWidth > 10) {
                border0 = 350;
            } else {
                border0 = (this.viewWidth / rootWidth) * 35;
            }
            xScale = (this.viewWidth - border0) / rootWidth;
        }

        if (xScale > yScale && yScale < this.visualConfig.MAX_ADJUST) {
            root.scale.x = yScale * 0.8;
            root.scale.y = yScale * 0.8;
        } else if (yScale >= xScale && xScale < this.visualConfig.MAX_ADJUST) {
            root.scale.x = xScale * 0.8;
            root.scale.y = xScale * 0.8;
        } else {
            root.scale.x = this.visualConfig.MAX_ADJUST * 0.8;
            root.scale.y = this.visualConfig.MAX_ADJUST * 0.8;
        }

        root.position.x = this.viewWidth / 2;
        root.position.y = this.viewHeight / 2;
    }

    unSelectSubGraph(nodeIdArray, edgeIdArray) {
        if (nodeIdArray) {
            _.each(nodeIdArray, (nodeId) => {
                const nodeSprite = this.nodeSprites[nodeId];
                if (nodeSprite.selected) {
                    this.nodeContainer.deselectNode(nodeSprite);
                }
            });
        }
        if (edgeIdArray) {
            _.each(this.edgeSprites, (edgeSprite) => {
                const actualId = edgeSprite.id;
                if (_.indexOf(edgeIdArray, actualId) >= 0) {
                    this.edgeContainer.deselectLink(edgeSprite);
                }
            });
        }
        this.selectionChanged();
    }

    selectSubGraph(nodeIdArray, edgeIdArray) {
        if (nodeIdArray) {
            _.each(nodeIdArray, (nodeId) => {
                const nodeSprite = this.nodeSprites[nodeId];
                if (nodeSprite) {
                    this.nodeContainer.selectNode(nodeSprite);
                }
            });
        }
        _.each(this.edgeSprites, (edgeSprite) => {
            const actualId = edgeSprite.id;
            if (_.indexOf(edgeIdArray, actualId) >= 0) {
                this.edgeContainer.selectLink(edgeSprite);
            }
        });
        this.selectionChanged();
    }

    clearSelection() {
        this.nodeContainer.deselectAllNodes();
        this.edgeContainer.deselectAllLinks();
        this.selectionChanged();
    }

    selectLinksFromNodes(startingNodes, direction, alsoSelectNodes) {
        _.each(startingNodes, (n) => {
            if (direction === 'both' || direction === 'in') {
                _.each(n.incoming, (l) => {
                    this.edgeContainer.selectLink(l);
                    if (alsoSelectNodes) {
                        this.nodeContainer.selectNode(this.nodeSprites[l.fromId]);
                    }
                });
            }
            if (direction === 'both' || direction === 'out') {
                _.each(n.outgoing, (l) => {
                    this.edgeContainer.selectLink(l);
                    if (alsoSelectNodes) {
                        this.nodeContainer.selectNode(this.nodeSprites[l.toId]);
                    }
                });
            }
        });
        this.selectionChanged();
    }

    selectNodesOfLinks(selectedEdges) {
        _.each(selectedEdges, (l) => {
            const d = l.data;
            const srcNode = this.nodeSprites[d.sourceEntity];
            const tgtNode = this.nodeSprites[d.targetEntity];
            if (srcNode) {
                this.nodeContainer.selectNode(srcNode);
            }
            if (tgtNode) {
                this.nodeContainer.selectNode(tgtNode);
            }
        });
        this.selectionChanged();
    }

    /**
     * 选择端点和链接
     * @param {[]} selectedNodes nodeSprite
     * @param {[]} selectedLinks edgeSprite
     */
    selectNodesAndLinks(selectedNodes, selectedLinks) {
        this.selectLinksFromNodes(selectedNodes, 'both', true);
        this.selectNodesOfLinks(selectedLinks);
    }

    selectAll() {
        _.each(this.edgeSprites, (l) => {
            this.edgeContainer.selectLink(l);
        });
        _.each(this.nodeSprites, (n) => {
            this.nodeContainer.selectNode(n);
        });
        this.selectionChanged();
    }

    selectReverseSelection() {
        _.each(this.edgeSprites, (l) => {
            if (l.selected) {
                this.edgeContainer.deselectLink(l);
            } else {
                this.edgeContainer.selectLink(l);
            }
        });
        _.each(this.nodeSprites, (n) => {
            if (n.selected) {
                this.nodeContainer.deselectNode(n);
            } else {
                this.nodeContainer.selectNode(n);
            }
        });
        this.selectionChanged();
    }

    zoomIn() {
        const x = this.viewWidth / 2;
        const y = this.viewHeight / 2;
        this.stage.zoomHandler(x, y, true);
    }

    zoomOut() {
        const x = this.viewWidth / 2;
        const y = this.viewHeight / 2;
        this.stage.zoomHandler(x, y, false);
    }

    /**
     * 力导向布局
     */
    async force() {
        this.layout = new ForceLayout(this.nodeSprites, this.edgeSprites, this.nodeContainer, this.visualConfig);
        await this.layout.run();
        return Promise.resolve();
    }

    /**
     * WASM方式实现的布局
     */
    WASMLayout(wasmType) {
        this.layout = new WASMGenerator(this.nodeSprites, this.edgeSprites, this.nodeContainer, this.visualConfig);
        return this.layout.run(wasmType);
    }

    /**
     * 圆形布局
     */
    circle() {
        this.layout = new CircleLayout(this.nodeSprites, this.edgeSprites, this.nodeContainer, this.visualConfig);
        return this.layout.run();
    }

    /**
     * 辐射布局
     */
    radiate() {
        this.layout = new RadiateLayout(this.nodeSprites, this.edgeSprites, this.nodeContainer, this.visualConfig);
        return this.layout.run();
    }

    /**
     * 结构布局
     */
    structural() {
        this.layout = new StructuralLayout(this.nodeSprites, this.edgeSprites, this.nodeContainer, this.visualConfig);
        return this.layout.run();
    }

    /**
     * 层次布局
     */
    layered() {
        this.layout = new LayeredLayout(this.nodeSprites, this.edgeSprites, this.nodeContainer, this.visualConfig);
        return this.layout.run();
    }

    setTwoNodeLayoutInXDireaction(nodeIDArray) {
        if (this.nodeSprites.length === 0) {
            return;
        }
        const renderer = this;
        const nodeMarginX = this.viewWidth / (_.keys(this.nodeSprites).length + 1);
        let currentX = 0;
        _.each(this.nodeSprites, (nodeSprite, nodeId) => {
            renderer.setNodePosition(nodeId, currentX, 0);
            nodeSprite.updateNodePosition(this.layout.getNodePosition(nodeId), true);
            this.nodeContainer.nodeMoved(nodeSprite);
            currentX += nodeMarginX;
        });
    }

    setNodePosition(nodeId, x, y, z) {
        // this.layout.setNodePosition(nodeId, x, y, z);
    }

    // convert the canvas drawing buffer into base64 encoded image url
    exportImage(width, height, clip) {
        return new Promise((resolve, reject) => {
            let imageCanvas;
            if (clip) {
                width = this.renderer.width;
                height = this.renderer.height;
            }
            if (this.renderer.gl) {
                imageCanvas = extract.webglExport(this.renderer, this.root, width, height, clip);
            } else {
                imageCanvas = extract.canvasExport(this.renderer, this.root, width, height, clip);
            }
            const displayCanvas = new PIXI.CanvasRenderTarget(width, height);
            const hRatio = width / imageCanvas.width;
            const vRatio = height / imageCanvas.height;
            const ratio = Math.min(hRatio, vRatio);
            const shiftX = (width - imageCanvas.width * ratio) / 2;
            const shiftY = (height - imageCanvas.height * ratio) / 2;

            displayCanvas.context.fillStyle = `#${this.visualConfig.backgroundColor.toString(16)}`;
            displayCanvas.context.fillRect(0, 0, width, height);
            if (imageCanvas.width || imageCanvas.height) {
                displayCanvas.context.drawImage(imageCanvas, 0, 0, imageCanvas.width, imageCanvas.height, shiftX, shiftY, imageCanvas.width * ratio, imageCanvas.height * ratio);
            }

            resolve(displayCanvas.canvas.toDataURL());
        });
    }

    resize(width, height) {
        this.renderer.resize(width, height);
    }

    /**
     * 左对齐
     * @param {[]} nodes nodeSprite
     */
    alignLeft(nodes) {
        this._checkNodes(nodes);

        let minPositionX = Number.MAX_SAFE_INTEGER;
        for (const node of nodes) {
            const leftBorder = node.position.x - node.scale.x * this.visualConfig.NODE_SELECTION_FRAME_WIDTH * 0.5;
            if (leftBorder < minPositionX) {
                minPositionX = leftBorder;
            }
        }

        for (const node of nodes) {
            node.position.x = minPositionX + node.scale.x *  this.visualConfig.NODE_SELECTION_FRAME_WIDTH * 0.5;
            node.updateNodePosition(node.position, true);
            this.nodeContainer.nodeMoved(node);
        }
    }

    /**
     * 右对齐
     * @param {[]} nodes nodeSprite
     */
    alignRight(nodes) {
        this._checkNodes(nodes);

        let maxPositionX = Number.MIN_SAFE_INTEGER;
        for (const node of nodes) {
            const rightBorder = node.position.x + node.scale.x * this.visualConfig.NODE_SELECTION_FRAME_WIDTH * 0.5;
            if (rightBorder > maxPositionX) {
                maxPositionX = rightBorder;
            }
        }

        for (const node of nodes) {
            node.position.x = maxPositionX - node.scale.x * this.visualConfig.NODE_SELECTION_FRAME_WIDTH * 0.5;
            node.updateNodePosition(node.position, true);
            this.nodeContainer.nodeMoved(node);
        }
    }

    /**
     * 垂直对齐
     * @param {[]} nodes nodeSprite
     */
    alignVertical(nodes) {
        this._checkNodes(nodes);

        let sumPositionX = 0;
        for (const node of nodes) {
            sumPositionX += node.position.x;
        }
        const avgPositionX = sumPositionX / nodes.length;

        for (const node of nodes) {
            node.position.x = avgPositionX;
            node.updateNodePosition(node.position, true);
            this.nodeContainer.nodeMoved(node);
        }
    }

    /**
     * 水平对齐
     * @param {[]} nodes nodeSprite
     */
    alignHorizontal(nodes) {
        this._checkNodes(nodes);

        let sumPositionY = 0;
        for (const node of nodes) {
            sumPositionY += node.position.y;
        }
        const avgPositionY = sumPositionY / nodes.length;

        for (const node of nodes) {
            node.position.y = avgPositionY;
            node.updateNodePosition(node.position, true);
            this.nodeContainer.nodeMoved(node);
        }
    }

    /**
     * 底端对齐
     * @param {[]]} nodes nodeSprite
     */
    alignBottom(nodes) {
        this._checkNodes(nodes);

        let maxPositionY = Number.MIN_SAFE_INTEGER;
        for (const node of nodes) {
            const bottomBorder = node.position.y + node.scale.y * this.visualConfig.NODE_SELECTION_FRAME_WIDTH * 0.5;
            if (bottomBorder > maxPositionY) {
                maxPositionY = bottomBorder;
            }
        }

        for (const node of nodes) {
            node.position.y = maxPositionY - node.scale.y * this.visualConfig.NODE_SELECTION_FRAME_WIDTH * 0.5;
            node.updateNodePosition(node.position, true);
            this.nodeContainer.nodeMoved(node);
        }
    }

    /**
     * 顶端对齐
     * @param {[]} nodes nodeSprite
     */
    alignTop(nodes) {
        this._checkNodes(nodes);

        let minPositionY = Number.MAX_SAFE_INTEGER;
        for (const node of nodes) {
            const topBorder = node.position.y - node.scale.y * this.visualConfig.NODE_SELECTION_FRAME_WIDTH * 0.5;
            if (topBorder < minPositionY) {
                minPositionY = topBorder;
            }
        }

        for (const node of nodes) {
            node.position.y = minPositionY + node.scale.y * this.visualConfig.NODE_SELECTION_FRAME_WIDTH * 0.5;
            node.updateNodePosition(node.position, true);
            this.nodeContainer.nodeMoved(node);
        }
    }

    /**
     * 横向分布
     * @param {[]} nodes nodeSprite
     */
    horizontalDistribution(nodes) {
        this._checkNodes(nodes);

        const topLeft = this.root.worldTransform.applyInverse({x: 0, y: 0});
        const bottomRight = this.root.worldTransform.applyInverse({x: this.viewWidth, y: this.viewHeight});
        nodes.sort((a, b) => {
            return a.position.x - b.position.x;
        });

        const nodesSize = nodes.length - 1;
        const minPositionX = nodes[0].position.x;
        const maxPositionX = nodes[nodesSize].position.x;
        let stepSize = (maxPositionX - minPositionX) / nodesSize;
        const distance = nodes[0].scale.x * this.visualConfig.NODE_SELECTION_FRAME_WIDTH * 0.5 + nodes[nodesSize].scale.x * this.visualConfig.NODE_SELECTION_FRAME_WIDTH * 0.5;
        if (stepSize < distance && (minPositionX > topLeft.x || maxPositionX < bottomRight.x)) { // 选择的实体之间距离过小，并且X轴最小或最大位置在可视范围内，则尝试移动X轴最小、最大的位置以分布其中的其它元素
            const diff = (distance - stepSize) * nodesSize;
            let hasmoved = false;
            if (minPositionX - topLeft.x > bottomRight.x - maxPositionX) { // X轴位置最小 离左边距距离 大于 X轴位置最大 离右边距距离
                if (minPositionX - diff > topLeft.x) { // X轴位置最小 向左移动diff后还在图表可视范围内
                    nodes[0].position.x = minPositionX - diff;
                    stepSize = distance;
                    hasmoved = true;
                    nodes[0].updateNodePosition(nodes[0].position, true);
                    this.nodeContainer.nodeMoved(nodes[0]);
                }
            } else {
                if (maxPositionX + diff < bottomRight.x) { // X轴位置最大 向右移动diff后还在图表可视范围内
                    nodes[nodesSize].position.x = maxPositionX + diff;
                    stepSize = distance;
                    hasmoved = true;
                    nodes[nodesSize].updateNodePosition(nodes[nodesSize].position, true);
                    this.nodeContainer.nodeMoved(nodes[nodesSize]);
                }
            }

            if (!hasmoved) {
                if (minPositionX - diff / 2 > topLeft.x && maxPositionX + diff / 2 < bottomRight.x) { // X轴 向左移动或向右移动diff后不在图表可视范围内，则X轴位置最小 向左移动diff/2后在图表可视范围内并且X轴位置最大 向右移动diff/2后在图表可视范围内
                    nodes[0].position.x = minPositionX - diff / 2;
                    nodes[nodesSize].position.x = maxPositionX + diff / 2;
                    stepSize = distance;
                    nodes[0].updateNodePosition(nodes[0].position, true);
                    this.nodeContainer.nodeMoved(nodes[0]);
                    nodes[nodesSize].updateNodePosition(nodes[nodesSize].position, true);
                    this.nodeContainer.nodeMoved(nodes[nodesSize]);
                }
            }
        }

        for (let i = 1; i < nodesSize; i++) { // 横向分布，其它实体均匀分布之间
            const node = nodes[i];
            node.position.x = nodes[i-1].position.x + stepSize;
            node.updateNodePosition(node.position, true);
            this.nodeContainer.nodeMoved(node);
        }
    }

    /**
     * 纵向分布
     * @param {[]} nodes nodeSprite
     */
    verticalDistribution(nodes) {
        this._checkNodes(nodes);

        const topLeft = this.root.worldTransform.applyInverse({x: 0, y: 0});
        const bottomRight = this.root.worldTransform.applyInverse({x: this.viewWidth, y: this.viewHeight});
        nodes.sort((a, b) => {
            return a.position.y - b.position.y;
        });

        const nodesSize = nodes.length - 1;
        const minPositionY = nodes[0].position.y;
        const maxPositionY = nodes[nodesSize].position.y;
        let stepSize = (maxPositionY - minPositionY) / nodesSize;
        const distance = nodes[0].scale.y * this.visualConfig.NODE_SELECTION_FRAME_WIDTH * 0.5 + nodes[nodesSize].scale.y * this.visualConfig.NODE_SELECTION_FRAME_WIDTH * 0.5;
        if (stepSize < distance && (minPositionY > topLeft.y || maxPositionY < bottomRight.y)) { // 选择的实体之间距离过小，并且Y轴最小或最大位置在可视范围内，则尝试移动Y轴最小、最大的位置以分布其中的其它元素
            const diff = (distance - stepSize) * nodesSize;
            let hasmoved = false;
            if (minPositionY - topLeft.y > bottomRight.y - maxPositionY) { // Y轴位置最小 离顶部距距离 大于 Y轴位置最大 离底部距距离
                if (minPositionY - diff > topLeft.y) { // Y轴位置最小 向上移动diff后还在图表可视范围内
                    nodes[0].position.y = minPositionY - diff;
                    stepSize = distance;
                    hasmoved = true;
                    nodes[0].updateNodePosition(nodes[0].position, true);
                    this.nodeContainer.nodeMoved(nodes[0]);
                }
            } else {
                if (maxPositionY + diff < bottomRight.y) { // Y轴位置最大 向下移动diff后还在图表可视范围内
                    nodes[nodesSize].position.y = maxPositionY + diff;
                    stepSize = distance;
                    hasmoved = true;
                    nodes[nodesSize].updateNodePosition(nodes[nodesSize].position, true);
                    this.nodeContainer.nodeMoved(nodes[nodesSize]);
                }
            }

            if (!hasmoved) {
                if (minPositionY - diff / 2 > topLeft.y && maxPositionY + diff / 2 < bottomRight.y) { // Y轴 向上移动或向下移动diff后不在图表可视范围内，则Y轴位置最小 向左移动diff/2后在图表可视范围内并且Y轴位置最大 向右移动diff/2后在图表可视范围内
                    nodes[0].position.y = minPositionY - diff / 2;
                    nodes[nodesSize].position.y = maxPositionY + diff / 2;
                    stepSize = distance;
                    nodes[0].updateNodePosition(nodes[0].position, true);
                    this.nodeContainer.nodeMoved(nodes[0]);
                    nodes[nodesSize].updateNodePosition(nodes[nodesSize].position, true);
                    this.nodeContainer.nodeMoved(nodes[nodesSize]);
                }
            }
        }

        for (let i = 1; i < nodesSize; i++) { // 纵向分布，其它实体均匀分布之间
            const node = nodes[i];
            node.position.y = nodes[i-1].position.y + stepSize;
            node.updateNodePosition(node.position, true);
            this.nodeContainer.nodeMoved(node);
        }
    }

    /**
     * 向四周移动
     * @param nodes
     * @param direction
     */
    move(nodes, direction) {
        nodes.forEach((node) => {
            if (direction === 'up') {
                node.position.y--;
            } else if (direction === 'down'){
                node.position.y++;
            } else if (direction === 'left'){
                node.position.x--;
            } else if (direction === 'right'){
                node.position.x++;
            }
            node.updateNodePosition(node.position, true);
            this.nodeContainer.nodeMoved(node);
        });
    }

    /**
     * 检查参数是否合法
     * @param {[]} nodes nodeSprite
     */
    _checkNodes(nodes) {
        if (!nodes || !nodes.length || nodes.length < 2) {
            throw new Error('select nodes must exists and length must greater than 1');
        }
    }

    /**
     * Add a style rule, applying the specified attributes to all nodes & edges that match the specified selector.
     * The style of a node is re-computed when its degree or data changes, and automatically assigned when a node is added.
     * Rules are applied one after another. The latest added rule is applied last.
     * Rules are applied before attributes assigned through setAttributes, which are applied before classes.
     * @param options
     */
    addRule(options) {
        this.styleRules.push(options);
    }

    /**
     * Returns the list of all rules, in the order they are applied.
     */
    getRuleList() {
        return this.styleRules;
    }

    destroy() {
        this.graph.off('changed', this.onGraphChanged);
        this.animationAgent.destroy();
        _.each(this.nodeSprites, (ns) => {
            ns.destroy();
        });
        _.each(this.edgeSprites, (ls) => {
            ls.destroy();
        });

        this.nodeSprites = null;
        this.edgeSprites = null;
        this.layout = null;
        this.animationAgent = null;
        this.graph.clear();
        this.graph = null;
        this.counter.destroy();

        this.selectRegionGraphics.destroy(false);
        this.connectLineGraphics.destroy(false);
        this.borderContainer.destroy(false);
        this.edgeContainer.destroy(false);
        this.nodeContainer.destroy(false);

        this.root.destroy(false);
        this.stage.destroy(false);   // false to not let pixi containers destroy sprites.
        this.renderer.destroy(true); // true for removing the underlying view(canvas)
    }
}
