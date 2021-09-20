import lockIconUrl from '../../../../assets/images/subscript/lock_state.png';
import unknownIconUrl from '../../../../assets/images/subscript/unknown.png';
import circleBorderUrl from '../../../../assets/images/Circle.png';

export default class NodeSprite {
    constructor(node, visualConfig, labelContainer, iconContainer, borderContainer, styleRules) {
        // initialize subscript icon
        this.lockIcon = PIXI.Texture.fromImage(lockIconUrl);
        this.unknownIcon = PIXI.Texture.fromImage(unknownIconUrl);
        this.circleBorderTexture = PIXI.Texture.fromImage(circleBorderUrl);

        this.labelContainer = labelContainer;
        this.iconContainer = iconContainer;
        this.borderContainer = borderContainer;

        // addRule里添加的样式集合
        this.styleRules = styleRules;

        this.id = node.id;
        this.type = node.data.type;
        this.data = node.data;
        this.attributes = node.attributes;
        this.position = new PIXI.Point();
        this.position.x = this.attributes.x === undefined ? Math.random() * 20000 -10000 : this.attributes.x;
        this.position.y = this.attributes.y === undefined ?  Math.random() * 20000 -10000 : this.attributes.y;
        this.incoming = [];
        this.outgoing = [];

        this.scale = visualConfig.factor;

        this.boundaryAttr = {};
        this.boundaryAttr.border = {};
        this.boundaryAttr.fill = {};
        this.boundaryAttr.border.color = 0x0077b3;
        this.boundaryAttr.border.width = 1;
        this.boundaryAttr.border.alpha = 0.6;
        this.boundaryAttr.fill.color = 0xff6666;
        this.boundaryAttr.fill.alpha = 0.3;

        this.visualConfig = visualConfig;
        this.interactive = true;

        this._selected = false;

        // 是否是未知类型的实体
        this.isUnknown = this.attributes._$unknown || this.attributes._$lazy;
        // 设置unknown图标
        if (this.isUnknown) {
            this.setNodeUnknownIcon();
        }

        this.label = new PIXI.Container();
        this.label.position.set(this.position.x, this.position.y + this.visualConfig.NODE_LABLE_OFFSET_Y  * this.scale / this.visualConfig.factor);
        this.label.scale.set(this.visualConfig.ui.label.scale, this.visualConfig.ui.label.scale);
        this.label.visible = this.visualConfig.ui.label.visibleByDefault;
        this.labelBgContainer = [];
        if (!this.attributes._$hideLabel) {
            this.createText();
        }
        this.labelContainer.addChild(this.label);

        this.fontStyle = {
            fontFamily : 'Font Awesome 5 Free',
            fontSize: this.visualConfig.NODE_ATTACH_ICON_WIDTH,
            fontWeight: 900,
            fill : this.visualConfig.BADGE_DEFAULT_COLOR,
            align : 'center'
        };
    }

    createText() {
        let labels = this.data.label;

        for (let item of this.styleRules) {
            const attr = item.nodeAttributes;
            if (attr && attr.label != null && typeof attr.label === 'function') {
                labels = attr.label(this);
            }
        }

        if (labels && labels.length > 0) {
            labels = labels.split('\n');
        } else {
            labels = [];
        }
        labels.forEach((label, index) => {
            let t;
            if (this.visualConfig.font) {
                try {
                    t = new PIXI.extras.BitmapText((label ? label : ''), {
                        font: {
                            name : this.visualConfig.font.font,
                            size: this.visualConfig.ui.label.font.size
                        },
                        tint: this.visualConfig.ui.label.font.color
                    });
                } catch {
                    t = new PIXI.Text(label ? label : '');
                }
            } else {
                t = new PIXI.Text(label ? label : '');
            }

            t.position.set(0, this.visualConfig.NODE_LABLE_OFFSET_BETWEEN_LINE * index);
            t.anchor.x = 0.5;
            t.anchor.y = 0.5;

            const labelBg = new PIXI.Sprite(PIXI.Texture.WHITE);
            labelBg.alpha = 1;
            labelBg.tint = this.visualConfig.ui.label.background.color;
            labelBg.width = t.width + 4;
            labelBg.height = t.height + 4;
            labelBg.position.set(t.position.x, t.position.y);
            labelBg.anchor.x = 0.5;
            labelBg.anchor.y = 0.5;
            labelBg.visible = t.visible;

            this.label.addChild(labelBg);
            this.label.addChild(t);

            this.labelBgContainer.push(labelBg);
        });
    }

    /**
     * An alias to position.x
     * @member {number}
     */
    get x()
    {
        return this.position.x;
    }

    /**
     * An alias to position.y
     * @member {number}
     */
    get y()
    {
        return this.position.y;
    }

    set selected(isSelected) {
        this._selected = isSelected;
    }

    get selected() {
        return this._selected;
    }

    selectionChanged(selected) {
        const vizConf = this.visualConfig;
        this._selected = selected;
        if (selected) {
            if (this.label) {
                this.label.tint = vizConf.ui.label.font.highlight;
                this.labelBgContainer.forEach((labelBg) => {
                    labelBg.tint = vizConf.ui.label.background.highlight;
                });
            }
        } else {
            if (this.label) {
                this.label.tint = vizConf.ui.label.font.color;
                this.labelBgContainer.forEach((labelBg) => {
                    labelBg.tint = vizConf.ui.label.background.color;
                });
            }
        }
    }

    /**
     * 初始化实体时设置属性
     */
    setAttributes() {
        this.updateBorder();
        this.updateBadge();
    }

    /**
     * 更新顶点的缩放
     */
    updateScale() {
        let latestScale = 1.0;
        for (let item of this.styleRules) {
            const attr = item.nodeAttributes;
            if (attr && attr.scale != null && typeof attr.scale === 'number') {
                latestScale = attr.scale;
            }
        }

        let isValue = this.attributes.scale || latestScale;
        if (isValue) {
            const zoomValue = isValue;
            if (!Object.prototype.toString.call(zoomValue).includes('Number') || Number.isNaN(zoomValue)) return false; // 如果zoomValue格式非法，不做处理
            const vizConf = this.visualConfig;
            const scaleValue = zoomValue * vizConf.factor;
            const labelScale = zoomValue * vizConf.ui.label.scale;
            this.scale = scaleValue;
            if (this.label) {
                this.label.scale.set(labelScale, labelScale);
                this.label.position.set(this.position.x, this.position.y +  vizConf.NODE_LABLE_OFFSET_Y * this.scale / vizConf.factor);
            }

            if (this.circleBorder) {
                // this.circleBorder.scale.set(zoomValue);
                this.circleBorder.scale.set(this.scale, this.scale);
            }

            if (this.os) {
                for (let i = 0; i < this.os.length; i++) {
                    this.os[i].scale.set(0.5 * zoomValue);
                }

                this.redrawBadge();
            }

            if (this.unknownSprite) {
                this.unknownSprite.scale.set(0.2 * this.scale / vizConf.factor, 0.2 * this.scale / vizConf.factor);
            }
        }
    }

    /**
     * 更新circleBorder
     */
    updateBorder() {
        let latestColor = '';
        for (let item of this.styleRules) {
            const attr = item.nodeAttributes;
            if (attr && attr.borderColor && typeof attr.borderColor === 'string') {
                latestColor = attr.borderColor;
            }
        }

        let isValue = this.attributes.borderColor || latestColor;
        if (isValue) {
            const borderColor = isValue;
            if (!Object.prototype.toString.call(borderColor).includes('String')) return false; // 如果borderColor格式非法，不做处理
            const vizConf = this.visualConfig;
            const defaultStyle = vizConf.formatting.nodeBorder;
            let colorHex = borderColor;
            if (typeof borderColor === 'string' && borderColor.startsWith('#')) {
                colorHex = parseInt('0x' + borderColor.substring(1), 16);
            }
            this.boundaryAttr = {
                border: {
                    color: colorHex,
                    width: defaultStyle.border.width,
                    alpha: defaultStyle.border.alpha,
                },
                fill: {
                    color: colorHex,
                    alpha: 0.3,
                },
            };
            if (!this.circleBorder) {
                const borderTexture = this.circleBorderTexture;
                const circleBorder = new PIXI.Sprite(borderTexture);
                circleBorder.scale.set(this.scale, this.scale);
                circleBorder.position.set(this.position.x, this.position.y);
                circleBorder.anchor.x = 0.5;
                circleBorder.anchor.y = 0.5;
                circleBorder.tint = colorHex;
                this.circleBorder = circleBorder;
                this.borderContainer.addChild(this.circleBorder);
            } else {
                this.circleBorder.tint = colorHex;
                this.circleBorder.scale.set(this.scale, this.scale);
            }
        } else if (this.circleBorder) {
            this.borderContainer.removeChild(this.circleBorder);
            this.circleBorder = null;
            this.boundaryAttr = null;
        }
    }

    /**
     * 更新顶点及其相关元素的位置.
     */
    updateNodePosition(p, forceLinkUpdate = false) {
        this._updateNodeAttachPosition(p);
        _.each(this.incoming, function (l) {
            l.setTo(p);
            if(forceLinkUpdate) {
                l.updatePosition();
            }
        });
        _.each(this.outgoing, function (l) {
            l.setFrom(p);
            if(forceLinkUpdate) {
                l.updatePosition();
            }
        });
    }

    _updateNodeAttachPosition(p) {
        const vizConf = this.visualConfig;
        this.position.x = p.x;
        this.position.y = p.y;
        if (this.label) {
            this.label.position.x = p.x;
            this.label.position.y = p.y + vizConf.NODE_LABLE_OFFSET_Y * this.scale / vizConf.factor;
        }

        if (this.unknownSprite) {
            this.unknownSprite.position.x = this.position.x;
            this.unknownSprite.position.y = this.position.y;
        }

        if (this.os && this.os.length > 0) {
            this.redrawBadge();
        }

        if (this.circleBorder) {
            this.circleBorder.position.x = p.x;
            this.circleBorder.position.y = p.y;
        }
    }

    updateLabel() {
        this.labelBgContainer = [];
        this.label.removeChildren();
        if (!this.attributes._$hideLabel) {
            this.createText();
        }
    }

    /**
     * 更新角标及其缩放
     */
    updateBadge() {
        let latestBadge = {};
        for (let item of this.styleRules) {
            const attr = item.nodeAttributes;
            if (attr && attr.badges !== null && typeof attr.badges === 'object') {
                latestBadge = attr.badges;
            }
        }

        let isValue = this.attributes.badges || latestBadge;
        if (Object.keys(isValue).length) {
            const badges = isValue;
            if (!Object.prototype.toString.call(badges).includes('Object')) return false; // 如果badges格式非法，不做处理
            const badgeKeys = Object.keys(badges);
            if (!badges || !badgeKeys.length) {
                return false;
            }
            const nodeSprite = this;
            const badgePosition = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];

            // zoomValue -- 角标需要缩放的倍数
            let latestScale = 1.0;
            for (let item of this.styleRules) {
                const attr = item.nodeAttributes;
                if (attr && attr.scale != null && typeof attr.scale === 'number') {
                    latestScale = attr.scale;
                }
            }
            let zoomValue = this.attributes.scale || latestScale;

            let iconSprite = {};

            // 保存iconSprite
            const initSprite = (item) => {
                iconSprite.name = `${item}`;
                iconSprite.anchor.x = 0.5;
                iconSprite.anchor.y = 0.5;
                this.iconContainer.addChild(iconSprite);

                const osArr = nodeSprite.os || [];
                osArr.unshift(iconSprite);
                nodeSprite.os = osArr;
                this.setSpritePosition(iconSprite);
            };

            // 初始化并更新iconSprite的尺寸
            const uploadImage = (item, src) => {
                let icon = PIXI.Texture.fromImage(src);
                iconSprite = new PIXI.Sprite(icon);
                iconSprite.width = this.visualConfig.NODE_ATTACH_ICON_WIDTH * 0.5 * zoomValue;
                iconSprite.height = this.visualConfig.NODE_ATTACH_ICON_WIDTH * 0.5 * zoomValue;
                initSprite(item);
            };

            // 图片加载完成后再进行后续操作
            const onload = (item, src) => {
                let newImg = new Image();
                newImg.src = src;
                newImg.onload = () => {
                    uploadImage(item, src);
                };
            };

            for (let item of badgePosition) {
                if (badges[item]) {
                    if (badges[item].image) {
                        onload(item, badges[item].image);
                    } else if (badges[item].text && badges[item].text.content) {
                        iconSprite = new PIXI.Text(badges[item].text.content, this.fontStyle);
                        iconSprite.scale.set(0.5 * zoomValue, 0.5 * zoomValue);
                        initSprite(item);
                    } else { // set default iconSprite
                        onload(item, unknownIconUrl);
                    }
                }
            }
        }

    }

    setSpritePosition(iconSprite) {
        const NODE_OFFSET = this.visualConfig.NODE_STANDARD_SQUARE_WIDTH * 0.5 * this.scale;
        const position = iconSprite.name;
        if (position === 'topLeft') {
            iconSprite.position.x = this.position.x - NODE_OFFSET;
            iconSprite.position.y = this.position.y - NODE_OFFSET;
        } else if (position === 'topRight') {
            iconSprite.position.x = this.position.x + NODE_OFFSET;
            iconSprite.position.y = this.position.y - NODE_OFFSET;
        } else if (position === 'bottomRight') {
            iconSprite.position.x = this.position.x + NODE_OFFSET;
            iconSprite.position.y = this.position.y + NODE_OFFSET;
        } else if (position === 'bottomLeft') {
            iconSprite.position.x = this.position.x - NODE_OFFSET;
            iconSprite.position.y = this.position.y + NODE_OFFSET;
        } else { // illegal value, assign bottomRight value
            iconSprite.position.x = this.position.x + NODE_OFFSET;
            iconSprite.position.y = this.position.y + NODE_OFFSET;
        }

    }

    redrawBadge() {
        if (!this.os || this.os.length === 0) {
            return;
        }
        for (let i = this.os.length - 1; i >= 0; i--) {
            this.setSpritePosition(this.os[i])
        }
    }

    setNodeUnknownIcon() {
        const nodeSprite = this;
        if (!nodeSprite.unknownSprite) {
            const iconSprite = new PIXI.Sprite(this.unknownIcon);
            iconSprite.anchor.x = 0.5;
            iconSprite.anchor.y = 0.5;
            iconSprite.scale.set(0.2 * nodeSprite.scale / this.visualConfig.factor, 0.2 * nodeSprite.scale / this.visualConfig.factor);
            iconSprite.position.x = nodeSprite.position.x;
            iconSprite.position.y = nodeSprite.position.y;

            this.iconContainer.addChild(iconSprite);
            nodeSprite.unknownSprite = iconSprite;
        }
    }

    removeNodeUnknownIcon() {
        this.iconContainer.removeChild(this.unknownSprite);
        this.unknownSprite = null;
    }

    getData(value) {
        return this.data[value]
    }

    destroy() {
        if (this.label) {
            this.label.destroy({ texture: true, baseTexture: true });
            this.labelContainer.removeChild(this.label);
        }

        if (this.circleBorder) {
            this.borderContainer.removeChild(this.circleBorder);
        }

        if (this.unknownSprite) {
            this.iconContainer.removeChild(this.unknownSprite);
        }

        if (this.os) {
            for (let i = 0; i < this.os.length; i++) {
                this.iconContainer.removeChild(this.os[i]);
            }
        }
    }
}
