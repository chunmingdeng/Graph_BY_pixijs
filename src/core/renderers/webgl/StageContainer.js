import {detectLink, detectNode} from "./utils/Utils";
import {DETECT_MODES} from "../../const";

export default class StageContainer extends PIXI.Container {
    constructor(nodeSprites, edgeSprites, nodeContainer, edgeContainer, container, contentRoot, events) {
        super();

        this.nodeSprites = nodeSprites;
        this.edgeSprites = edgeSprites;

        this.nodeContainer = nodeContainer;
        this.edgeContainer = edgeContainer;

        this.contentRoot = contentRoot;

        this.events = events;

        this.mode = 'picking';

        this.on('mousedown', this.onCapture.bind(this));
        this.on('rightup', this.onRightUp.bind(this));
        container.addEventListener('wheel', this.zoom.bind(this), { passive: true });
    }

    releaseConnectLine(oldPosition, newPosition) {
        let startNode = null;
        let endNode = null;
        _.each(this.nodeSprites, (n) => {
            const size = 128 * n.scale.x;

            if (oldPosition.x > n.x - size && oldPosition.x < n.x + size && oldPosition.y > n.y - size && oldPosition.y < n.y + size) {
                startNode = n;
            }

            if (newPosition.x > n.x - size && newPosition.x < n.x + size && newPosition.y > n.y - size && newPosition.y < n.y + size) {
                endNode = n;
            }
        });
        if (startNode && endNode && startNode.id !== endNode.id) {
            // this.emit('connect-line', startNode.data, endNode.data);
            console.log('connect-line event');
        }
    }

    selectAllNodesInRegion(x1, y1, x2, y2, deselectOthers, onlyNode) {
        if (deselectOthers) {
            // this.root.deselectAll();
            this.nodeContainer.deselectAllNodes();
            this.edgeContainer.deselectAllLinks();
        }

        _.each(this.nodeSprites, (node) => {
            let detectFlag = detectNode(node, DETECT_MODES.AREA, x1, y1, x2, y2);
            if (detectFlag) {
                this.nodeContainer.selectNode(node);
            }
        });

        if (onlyNode) {
            return;
        }

        _.each(this.edgeSprites, (link) => {
            let detectFlag = detectLink(link, DETECT_MODES.AREA, x1, y1, x2, y2);
            if (detectFlag) {
                this.edgeContainer.selectLink(link);
            }
        });
    }

    moveSelectedNodes(dx, dy) {
        for (const node of this.nodeContainer.nodes) {
            const np = new PIXI.Point();
            np.x = node.position.x + dx;
            np.y = node.position.y + dy;
            node.updateNodePosition(np, true);
            this.nodeContainer.nodeMoved(node);
        }
    }

    handleMouseUp(e) {
        const mouseEvent = e.data.originalEvent;
        if (this.nodeContainer.recentlySelected) {
            const node = this.nodeContainer.recentlySelected;
            if (mouseEvent.ctrlKey) {
                if (node.selected) {   // multi-selecting
                    if (node.hadSelected) { // ctrl 已经选择的取消选择
                        this.nodeContainer.deselectNode(node);
                    } else {
                        this.nodeContainer.selectNode(node);
                    }
                } else {
                    this.nodeContainer.deselectNode(node);
                }
            } else {
                if (!this.dragJustNow && !this.selectingArea) {
                    // this.deselectAll();
                    this.nodeContainer.deselectAllNodes();
                    this.edgeContainer.deselectAllLinks();
                } else {
                    this.dragJustNow = false;
                }
                this.nodeContainer.selectNode(node);
            }
            this.nodeContainer.recentlySelected = null;
        } else if (this.edgeContainer.recentlySelected) {
            const line = this.edgeContainer.recentlySelected;
            if (mouseEvent.ctrlKey) {
                if (line.selected) {   // multi-selecting
                    this.edgeContainer.deselectLink(line);
                } else {
                    this.edgeContainer.selectLink(line);
                }
            }
            this.edgeContainer.recentlySelected = null;
        } else {
            // 非ctrl键时，取消选中
            // if (!this.parent.selectRegion && !mouseEvent.ctrlKey) {
            this.nodeContainer.deselectAllNodes();
            this.edgeContainer.deselectAllLinks();
            // }
        }
    }

    /**
     * {x0, y0} click point
     * @param {*} x0
     * @param {*} y0
     */
    selectSingleNode(x0, y0) {
        for (const nodeId in this.nodeSprites) {
            const node = this.nodeSprites[nodeId];
            let detectFlag = detectNode(node, DETECT_MODES.POINT, x0, y0);
            if (detectFlag) {
                this.nodeContainer.selectNode(node);
                const event = { type: 'node', original: null , target: node.data};
                this.events.emit('select', event);
                return node;
            }
        }
    }

    /**
     * {x0, y0} click point
     * @param {*} x0
     * @param {*} y0
     */
    selectSingleLink(x0, y0) {
        for (const edgeId in this.edgeSprites) {
            const edge = this.edgeSprites[edgeId];
            let detectFlag = detectLink(edge, DETECT_MODES.POINT, x0, y0);
            if (detectFlag) {
                this.edgeContainer.selectLink(edge);
                const event = { type: 'edge', original: null , target: edge.data};
                this.events.emit('select', event);
                return edge;
            }
        }
    }

    deselectAll() {
        this.nodeContainer.deselectAllNodes();
        this.edgeContainer.deselectAllLinks();
    }

    /**
     * {x0, y0} rightup click point
     * @param {*} x0
     * @param {*} y0
     */
    rightSelectHandler(e, x0, y0) {
        let event;

        for (const nodeId in this.nodeSprites)
        {
            const node = this.nodeSprites[nodeId];
            let detectFlag = detectNode(node, DETECT_MODES.POINT, x0, y0);
            if (detectFlag) {
                this.nodeContainer.selectNode(node);
                event = { type: 'node', original: e , target: node.data };
                break;
            }
        }

        if (event === undefined) {
            for (const edgeId in this.edgeSprites)
            {
                const edge = this.edgeSprites[edgeId];
                let detectFlag = detectLink(edge, DETECT_MODES.POINT, x0, y0);
                if (detectFlag) {
                    this.edgeContainer.selectLink(edge);
                    event = { type: 'edge' , original: e, target: edge.data};
                    break;
                }
            }
        }

        if (event === undefined) {
            event = { type: 'blank', original: e , target: null};
        }

        this.events.emit('contextmenu', event);
    }

    onCapture(e) {
        if (this.hasNodeCaptured) {
            return;
        }

        this.mouseLocation = {
            x: e.data.global.x,
            y: e.data.global.y,
        };
        if (this.mode === 'panning') {
            this.dragging = true;
        } else if (this.mode === 'picking') {
            let tnp = this.contentRoot.worldTransform.applyInverse(this.mouseLocation);
            const selectedNode = this.selectSingleNode(tnp.x, tnp.y);
            if (selectedNode) {
                this.selectingNode = true;
            } else {
                if (!e.data.originalEvent.ctrlKey) {
                    this.deselectAll();
                }
                this.selectingArea = true;
            }
            this.selectSingleLink(tnp.x, tnp.y);
        } else if (this.mode === 'connecting') {
            this.connectingLine = true;
        }
        if (!this.moveListener) {
            this.moveListener = this.onMove.bind(this);
            this.on('mousemove', this.moveListener);
        }
        if (!this.upListener) {
            this.upListener = this.onRelease.bind(this);
            this.on('mouseup', this.upListener);
        }
    }

    onMove(e) {
        const oldPosition = this.mouseLocation;
        const newPosition = e.data.global;
        const dx = newPosition.x - oldPosition.x;
        const dy = newPosition.y - oldPosition.y;
        if (this.dragging) {
            this.mouseLocation = {
                x: e.data.global.x,
                y: e.data.global.y,
            };
            this.contentRoot.position.x += dx;
            this.contentRoot.position.y += dy;
        } else if (this.selectingNode) {
            this.mouseLocation = {
                x: e.data.global.x,
                y: e.data.global.y,
            };
            let top = this.contentRoot.worldTransform.applyInverse(oldPosition);
            let tnp = this.contentRoot.worldTransform.applyInverse(newPosition);
            const tx = tnp.x - top.x;
            const ty = tnp.y - top.y;
            this.moveSelectedNodes(tx, ty);
            this.dragJustNow = true;
        } else if (this.selectingArea) {
            if (Math.abs(dx) > 5 && Math.abs(dy) > 5) {
                this.selectRegion = {
                    x1: oldPosition.x,
                    y1: oldPosition.y,
                    x2: newPosition.x,
                    y2: newPosition.y,
                };

                let top = this.contentRoot.worldTransform.applyInverse(oldPosition);
                let tnp = this.contentRoot.worldTransform.applyInverse(newPosition);
                const me = e.data.originalEvent;
                let flag = true;
                if (me.ctrlKey) {
                    flag = false;
                }
                let onlyNodeFlag = false;
                if (me.shiftKey) {
                    onlyNodeFlag = true;
                }
                this.selectAllNodesInRegion(top.x, top.y, tnp.x, tnp.y, flag, onlyNodeFlag);
            }
        } else if (this.connectingLine) {
            if (Math.abs(dx) > 5 && Math.abs(dy) > 5) {
                this.connectLine = {
                    x1: oldPosition.x,
                    y1: oldPosition.y,
                    x2: newPosition.x,
                    y2: newPosition.y,
                };
            }
        }
    }

    onRelease(e) {
        this.off('mousemove', this.moveListener);
        this.off('mouseup', this.upListener);

        this.handleMouseUp(e);

        // this.data = null;
        this.dragging = false;
        this.moveListener = null;
        this.upListener = null;

        // 拖动实体
        this.selectingNode = false;
        this.dragJustNow = false;

        // 框选区域
        this.selectingArea = false;
        this.selectRegion = null;

        // 手动添加连线
        if (this.connectingLine && this.connectLine) {
            const oldPosition = this.contentRoot.worldTransform.applyInverse({ x: this.connectLine.x1, y: this.connectLine.y1 });
            const newPosition = this.contentRoot.worldTransform.applyInverse({ x: this.connectLine.x2, y: this.connectLine.y2 });

            this.releaseConnectLine(oldPosition, newPosition);
        }
        this.connectingLine = false;
        this.connectLine = null;
    }

    onRightUp(e) {
        if (this.hasNodeCaptured) {
            return;
        }

        const newPosition = e.data.global;
        let tnp = this.contentRoot.worldTransform.applyInverse(newPosition);
        this.rightSelectHandler(e, tnp.x, tnp.y);
    }

    zoomHandler(x, y, isZoomIn) {
        const direction = isZoomIn ? 1 : -1;
        const factor = (1 + direction * 0.1);
        this.contentRoot.scale.x *= factor;
        this.contentRoot.scale.y *= factor;
        const beforeTransform = this.contentRoot.worldTransform.applyInverse({x, y});
        this.contentRoot.updateTransform();
        const afterTransform = this.contentRoot.worldTransform.applyInverse({x, y});
        this.contentRoot.position.x += (afterTransform.x - beforeTransform.x) * this.contentRoot.scale.x;
        this.contentRoot.position.y += (afterTransform.y - beforeTransform.y) * this.contentRoot.scale.y;
        this.contentRoot.updateTransform();
    }

    zoom(e) {
        this.zoomHandler(e.offsetX, e.offsetY, e.deltaY < 0);
    }
}
