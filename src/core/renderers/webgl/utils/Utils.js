import { DETECT_MODES } from "../../../const";

// 判断点P(x, y)与有向直线P1P2的关系. 小于0表示点在直线左侧，等于0表示点在直线上，大于0表示点在直线右侧
function evaluatePointToLine(x, y, x1, y1, x2, y2) {
    const a = y2 - y1;
    const b = x1 - x2;
    const c = x2 * y1 - x1 * y2;
    return a * x + b * y + c;
}

// 判断点P(x, y)是否在点P1(x1, y1), P2(x2, y2), P3(x3, y3)构成的三角形内（包括边）
function isPointInTriangle(x, y, x1, y1, x2, y2, x3, y3) {
    // 分别计算点P与有向直线P1P2, P2P3, P3P1的关系，如果都在同一侧则可判断点在三角形内
    // 注意三角形有可能是顺时针(d>0)，也可能是逆时针(d<0)。
    const d1 = evaluatePointToLine(x, y, x1, y1, x2, y2);
    const d2 = evaluatePointToLine(x, y, x2, y2, x3, y3);
    if (d1 * d2 < 0) {
        return false;
    }
    const d3 = evaluatePointToLine(x, y, x3, y3, x1, y1);
    if (d2 * d3 < 0) {
        return false;
    }
    return true;
}

/**
 * link and rectangle collision detect.
 * @param {*} link link graph link position;
 * @param {*} rectBox rectBox select region as a rectangle or click point spread as a rectangle;
 */
function linkCollisionDetect(link, rectBox) {
    const xl = rectBox.xl;
    const xr = rectBox.xr;
    const yt = rectBox.yt;
    const yb = rectBox.yb;
    let linkXl;
    let linkXr;
    let linkYt;
    let linkYb;
    if (link.x1 > link.x2) {
        linkXl = link.x2;
        linkXr = link.x1;
    } else {
        linkXl = link.x1;
        linkXr = link.x2;
    }
    if (link.y1 > link.y2) {
        linkYt = link.y2;
        linkYb = link.y1;
    } else {
        linkYt = link.y1;
        linkYb = link.y2;
    }
    if (linkXl <= xr && linkXr >= xl && linkYt <= yb && linkYb >= yt) { // 矩形碰撞检测  https://silentmatt.com/rectangle-intersection/
        let x = link.x2 - link.x1;
        x = x === 0 ? 1 : x;
        if (linkXl === linkXr) {    // 垂直的链接 水平设置1像素的偏移量
            linkXr = linkXl + 1;
        }
        const y = link.y2 - link.y1;
        const rectLeft = Math.max(linkXl, xl);
        const rectRight = Math.min(linkXr, xr);
        const rectLeftY = link.y1 + (rectLeft - link.x1) * y / x;
        const rectRightY = link.y1 + (rectRight - link.x1) * y / x;
        const rectBottom = Math.max(rectLeftY, rectRightY);
        const rectTop =  Math.min(rectLeftY, rectRightY);
        if (rectLeft <= xr && rectRight >= xl && rectTop <= yb && rectBottom >= yt) {
            return true;
        }
    }
    return false;
}

/**
 * detect whether the edgeSprite is selected.
 * @param {*} link link sprite object
 * @param {*}  [detectMode] - See {@link DETECT_MODES} for possible values
 * @param {number} x1 The x coordinate of first point
 * @param {number} y1 The y coordinate of first point
 * @param {number} [x2] The x coordinate of second point
 * @param {number} [y2] The y coordinate of second point
 */
export function detectLink(link, detectMode = DETECT_MODES.POINT, x1, y1, x2, y2) {
    let rectBox;
    if (detectMode === DETECT_MODES.POINT) {
        rectBox = {xl: x1 - 1, xr: x1 + 1, yt: y1 - 1, yb: y1 + 1};
    } else if (detectMode === DETECT_MODES.AREA) {
        let xl = Math.min(x1, x2);
        let xr = Math.max(x1, x2);
        let yt = Math.min(y1, y2);
        let yb = Math.max(y1, y2);
        rectBox = {xl, xr, yt, yb};
    }

    // linkPosition x1, y1 as straight line's from point,  x2, y2 as straight line's end point
    let detectFlag = false;
    let linkPosition = {};
    if (link._controlOffsetIndex === 0 && link.fromId !== link.toId) { // straight line and not self link
        linkPosition = {x1: link.x1, y1: link.y1, x2: link.x2, y2: link.y2};
        detectFlag = linkCollisionDetect(link, rectBox);
    } else {    // polyline consist of three strainght lines, when one of three strainght lines is detect as true, it is not necessary to detect other strainght line
        linkPosition = {x1: link.x1, y1: link.y1, x2: link.fx, y2: link.fy};  // first strainght line
        detectFlag = linkCollisionDetect(linkPosition, rectBox);

        if (!detectFlag) {
            linkPosition = {x1: link.fx, y1: link.fy, x2: link.tx, y2: link.ty};  // second strainght line
            detectFlag = linkCollisionDetect(linkPosition, rectBox);
        }

        if (!detectFlag) {
            linkPosition = {x1: link.tx, y1: link.ty, x2: link.x2, y2: link.y2};  // third strainght line
            detectFlag = linkCollisionDetect(linkPosition, rectBox);
        }
    }

    if (!detectFlag) {
        const height = 3.2 * link.lineWidth;
        const width = 9.6 * link.lineWidth;

        let leftTopX = link.perpendicularVector[0] * height + link.midX;
        let leftTopY = link.perpendicularVector[1] * height + link.midY;
        let leftBottomX = -link.perpendicularVector[0] * height + link.midX;
        let leftBottomY = -link.perpendicularVector[1] * height + link.midY;
        let rightX = link.unitVector[0] * width + link.midX;
        let rightY = link.unitVector[1] * width + link.midY;

        detectFlag = isPointInTriangle(x1, y1, leftTopX, leftTopY, leftBottomX, leftBottomY, rightX, rightY);
    }

    return detectFlag;
}

/**
 * detect whether the NodeSprite is selected.
 * @param {*} nodeSprite link sprite object
 * @param {*}  [detectMode] - See {@link DETECT_MODES} for possible values
 * @param {number} x1 The x coordinate of first point
 * @param {number} y1 The y coordinate of first point
 * @param {number} [x2] The x coordinate of second point
 * @param {number} [y2] The y coordinate of second point
 */
export function detectNode(nodeSprite, detectMode = DETECT_MODES.POINT, x1, y1, x2, y2) {
    let detectFlag = false;

    if (detectMode === DETECT_MODES.POINT) {
        const size = 128 * nodeSprite.scale;
        if (x1 > nodeSprite.x - size && x1 < nodeSprite.x + size && y1 > nodeSprite.y - size && y1 < nodeSprite.y + size) {
            detectFlag = true;
        }
    } else if (detectMode === DETECT_MODES.AREA) {
        let xl = Math.min(x1, x2);
        let xr = Math.max(x1, x2);
        let yt = Math.min(y1, y2);
        let yb = Math.max(y1, y2);
        if ((nodeSprite.x <= xr) && (nodeSprite.x >= xl) && (nodeSprite.y >= yt) && (nodeSprite.y <= yb)) {
            detectFlag = true;
        }
    }
    return detectFlag;
}