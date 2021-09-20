import NodeRenderer from './NodeRenderer';
import Bimap from '../utils/Bimap';
import { getBufferSize } from '../utils/Utility';
import { drawColor, drawFont } from '../utils/shapes';
import { ICON_TYPE } from "../../../const";

import selectionFrameUrl from '../../../../assets/images/Square.png';

const defaultIconUrl = 'DefaultIcon';

/**
 * Container contains Node.
 * @class
 * @extends PIXI.Container
 */
export default class NodeContainer extends PIXI.Container {
    constructor(renderer, styleRules) {
        super();

        this.pluginName = 'node-container';

        this.idIndexMap = new Bimap('id', 'index');

        this.instanceCount = 0;

        this.allocateBuffer();

        this.needRefreshData = false;
        this.needRefreshOffset = false;
        this.needRefreshSelection = false;

        // 将选中的节点以数组保存 [node1, node2, ...]
        this.nodes = [];
        // 将选中的节点以对象保存 { node.id1: node1, node.id2: node2, ... }
        this.selectedNodes = new Map();
        this.recentlySelected = null;

        // big icon image
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext("2d");
        // the canvas size is 2048x2048, and icon size is 128 * 128
        this.context.canvas.width  = 2048;
        this.context.canvas.height = 2048;
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);

        this.iconMap = {};

        // add default icon.
        this.iconMap[defaultIconUrl] = 0;
        this.iconIndexArray.set([0], 0);
        drawColor(this.context, 0, 'grey');

        this.texture = PIXI.Texture.fromCanvas(this.canvas);

        this.selectionTexture = PIXI.Texture.fromImage(selectionFrameUrl);

        this.renderer = renderer;
        this.styleRules = styleRules;
    }

    /**
     * 分配缓存，内部使用
     */
    allocateBuffer() {
        this.bufferSize = getBufferSize(this.instanceCount);

        const tempOffsetArray = new Float32Array(2 * this.bufferSize);
        if (this.offSetArray) {
            tempOffsetArray.set(this.offSetArray);
        }
        this.offSetArray = tempOffsetArray;

        const tempScaleArray = new Float32Array(this.bufferSize);
        if (this.scaleArray) {
            tempScaleArray.set(this.scaleArray);
        }
        this.scaleArray = tempScaleArray;

        const tempIconIndexArray = new Float32Array(this.bufferSize);
        if (this.iconIndexArray) {
            tempIconIndexArray.set(this.iconIndexArray);
        }
        this.iconIndexArray = tempIconIndexArray;

        const tempIsUnknownArray = new Float32Array(this.bufferSize);
        if (this.isUnknownArray) {
            tempIsUnknownArray.set(this.isUnknownArray);
        }
        this.isUnknownArray = tempIsUnknownArray;

        const tempSelectedArray = new Float32Array(this.bufferSize);
        if (this.selectedArray) {
            tempSelectedArray.set(this.selectedArray);
        }
        this.selectedArray = tempSelectedArray;
    }

    _renderWebGL(renderer) {
        // this.calculateVertices();

        renderer.setObjectRenderer(renderer.plugins[this.pluginName]);
        renderer.plugins[this.pluginName].render(this);
    };

    /**
     * Renders the object using the WebGL renderer
     *
     * @param {PIXI.WebGLRenderer} renderer - The renderer
     */
    renderWebGL(renderer)
    {
        // if the object is not visible or the alpha is 0 then no need to render this element
        if (!this.visible || this.worldAlpha <= 0 || !this.renderable)
        {
            return;
        }

        this._renderWebGL(renderer);
    }

    addChild(child)
    {
        this.addNode(child);
        this.needRefreshData = true;
        this.needRefreshOffset = true;
        this.needRefreshSelection = true;
    }

    removeChild(child)
    {
        if (child.selected) {
            this.deselectNode(child);
        }

        this.removeNode(child.id);
        this.needRefreshData = true;
        this.needRefreshOffset = true;
        this.needRefreshSelection = true;
    }

    addNode(child) {
        this.instanceCount++;

        // 如果缓存太小，则增加缓存
        if (this.instanceCount > this.bufferSize){
            this.allocateBuffer();
        }

        const index = this.instanceCount - 1;

        this.idIndexMap.add({id: child.id, index});

        this.offSetArray.set([child.position.x, child.position.y] , 2 * index);

        // compute iconType and iconLocation
        let iconType = ICON_TYPE.COLOR;
        let iconLocation = defaultIconUrl;

        // nodeAttributes of addRule methods
        const nodeAttributes = (rule) => {
            const attr = rule.nodeAttributes;
            if (attr) {
                if (attr.image) {
                    iconType = ICON_TYPE.IMAGE;
                    const imageRule = attr.image;
                    const nodeType = child.data[imageRule.field];
                    iconLocation = imageRule.values[nodeType];
                }
                if (attr.borderColor) {
                    child.updateBorder();
                }
                if (attr.scale) {
                    this.updateNodeScale(child);
                }
                if (attr.color) {
                    iconType = ICON_TYPE.COLOR;
                    iconLocation = attr.color;
                }
                if (attr.icon) {
                    iconType = ICON_TYPE.FONT;
                    if (typeof attr.icon.content === 'string') {
                        iconLocation = attr.icon.content;
                    } else if(typeof attr.icon.content === 'function') {
                        iconLocation = attr.icon.content(child);
                    }
                }
                if (attr.badges) {
                    child.updateBadge(true);
                }
            }
        };
        this.styleRules.forEach((rule) => {
            if (rule.nodeSelector && typeof rule.nodeSelector === 'function') {
                let call = rule.nodeSelector.apply(this, arguments);
                if (!call) {
                    return false;
                }
            }
            nodeAttributes(rule);
        });
        if (child.attributes.color) {
            iconType = ICON_TYPE.COLOR;
            iconLocation = child.attributes.color;
        }
        if (child.attributes.icon) {
            iconType = ICON_TYPE.FONT;
            iconLocation = child.attributes.icon.content;
        }


        // set the icon based on iconType and iconLocation.
        let iconIndex = this.iconMap[iconLocation];
        if (iconIndex >= 0) {
            this.iconIndexArray.set([iconIndex], index);
        } else {
            iconIndex = Object.keys(this.iconMap).length;
            this.iconMap[iconLocation] = iconIndex;
            this.iconIndexArray.set([iconIndex], index);

            if (iconType === ICON_TYPE.IMAGE) {
                const image = new Image();
                image.onload = () => {
                    const row = Math.floor(iconIndex / 16.0);
                    const column = iconIndex - row * 16;
                    this.context.drawImage(image, column * 128, row * 128, 128, 128);
                    this.texture.update();

                    const gl = this.renderer.gl;
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                };
                image.src = iconLocation;
            } else if (iconType === ICON_TYPE.COLOR) {
                drawColor(this.context, iconIndex, iconLocation);
                this.texture.update();

                const gl = this.renderer.gl;
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            } else if (iconType === ICON_TYPE.FONT) {
                drawFont(this.context, iconIndex, iconLocation)
                this.texture.update();

                const gl = this.renderer.gl;
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            }
        }

        this.selectedArray.set([0.0], index);

        child.setAttributes();
        this.updateNodeScale(child);
        this.setNodeUnknownStatus(child);
    }

    removeNode(nodeId) {
        const index = this.idIndexMap.indexFrom(nodeId);
        this.idIndexMap.remove('id', nodeId);

        if (index < this.instanceCount - 1){
            const offsets = this.offSetArray.subarray(this.instanceCount * 2 - 2, this.instanceCount * 2);
            this.offSetArray.set(offsets, 2 * index);

            const scale = this.scaleArray.subarray(this.instanceCount - 1, this.instanceCount);
            this.scaleArray.set(scale, index);

            const iconIndex = this.iconIndexArray.subarray(this.instanceCount - 1, this.instanceCount);
            this.iconIndexArray.set(iconIndex, index);

            const isUnknown = this.isUnknownArray.subarray(this.instanceCount - 1, this.instanceCount);
            this.isUnknownArray.set(isUnknown, index);

            const selected = this.selectedArray.subarray(this.instanceCount - 1, this.instanceCount);
            this.selectedArray.set(selected, index);

            const existedId = this.idIndexMap.idFrom(this.instanceCount - 1);
            this.idIndexMap.remove('id', existedId);
            this.idIndexMap.add({id: existedId, index: index});
        }

        this.instanceCount--;
    }

    setNodeUnknownStatus(nodeSprite) {
        const index = this.idIndexMap.indexFrom(nodeSprite.id);
        if (nodeSprite.isUnknown) {
            this.isUnknownArray.set([1.0], index);
        } else {
            this.isUnknownArray.set([0.0], index);
        }
        this.needRefreshData = true;
    }

    /**
     * Update node's scale
     * @param {NodeSprite} nodeSprite
     * @param isRule
     */
    updateNodeScale(nodeSprite) {
        nodeSprite.updateScale();

        const index = this.idIndexMap.indexFrom(nodeSprite.id);
        this.scaleArray.set([nodeSprite.scale], index);
        this.needRefreshData = true;
        this.needRefreshSelection = true;
    }

    selectNode(node) {
        if (node) {
            if (!this.selectedNodes.has(node.id)) {
                this.selectedNodes.set(node.id, node);
                this.nodes.push(node);
                node.selectionChanged(true);

                const index = this.idIndexMap.indexFrom(node.id);
                this.selectedArray.set([1.0], index);
                this.needRefreshSelection = true;

                this.recentlySelected = node;
            } else {
                node.hadSelected = true;
            }
        }
    };

    deselectNode(node) {
        if (node.selected) {
            const index = this.nodes.indexOf(this.selectedNodes.get(node.id));
            if (index > -1) {
                this.nodes.splice(index, 1);
            }
            // 更新下节点样式
            node.selectionChanged(false);
            this.selectedNodes.delete(node.id);
            node.hadSelected = false;

            const selectedIndex = this.idIndexMap.indexFrom(node.id);
            this.selectedArray.set([0.0], selectedIndex);
            this.needRefreshSelection = true;
        }
    };

    deselectAllNodes() {
        if (this.selectedNodes.size > 0) {
            const self = this;
            this.selectedNodes.forEach((node) => {
                node.selectionChanged(false);
                node.hadSelected = false;

                const index = self.idIndexMap.indexFrom(node.id);
                self.selectedArray.set([0.0], index);
            });
            this.selectedNodes.clear();
            this.nodes = [];
            this.needRefreshSelection = true;
        }
    };

    nodeCaptured(node) {
        this.emit('nodeCaptured', node);
    }
    nodeMoved(node) {
        const index = this.idIndexMap.indexFrom(node.id);
        this.offSetArray.set([node.x, node.y] , 2 * index);

        this.needRefreshOffset = true;
    }
    nodeReleased(node) {
        this.emit('nodeReleased', node);
    }
}
