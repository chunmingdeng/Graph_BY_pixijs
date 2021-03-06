import { getMyLocalBounds } from './boundsHelper';

const getRenderTexture = function getRenderTexture(renderer, target, eWidth, eHeight) {
    // store the scale and position of target
    const tempScale = target.scale.x;
    const tempPositionX = target.position.x;
    const tempPositionY = target.position.y;

    // calc the new scale for web gl export
    const originRect = getMyLocalBounds.call(target);
    const hRatio = eWidth / originRect.width;
    const vRatio = eHeight / originRect.height;
    const ratio = Math.min(hRatio, vRatio);

    // set the proper scale and position
    target.scale.x = ratio;
    target.scale.y = ratio;
    target.position.x = (0 - originRect.x) * ratio;
    target.position.y = (0 - originRect.y) * ratio;

    // create a new render texture for web gl
    const baseRenderTexture = new PIXI.BaseRenderTexture(originRect.width * ratio, originRect.height * ratio);
    const renderTexture = new PIXI.RenderTexture(baseRenderTexture);
    renderer.render(target, renderTexture);

    // restore the scale and position of target after texture generated
    target.scale.x = tempScale;
    target.scale.y = tempScale;
    target.position.x = tempPositionX;
    target.position.y = tempPositionY;

    // although we set target transform, but its children not, so set the transform to all its children
    target.updateTransform();

    return renderTexture;
};

export default {
    /**
     * Creates a Canvas element, renders this target to it and then returns it.
     *
     * @param renderer
     * @param {PIXI.DisplayObject|PIXI.RenderTexture} target - A displayObject or renderTexture
     *  to convert. If left empty will use use the main renderer
     * @param eWidth
     * @param eHeight
     * @param clip
     * @return {HTMLCanvasElement} A Canvas element with the texture rendered on.
     */
    webglExport(renderer, target, eWidth, eHeight, clip) {
        const TEMP_RECT = new PIXI.Rectangle();
        const BYTES_PER_PIXEL = 4;
        let textureBuffer;
        let resolution;
        let frame;
        let flipY = false;

        const renderTexture = getRenderTexture(renderer, target, eWidth, eHeight);
        if (renderTexture && !clip) {
            textureBuffer = renderTexture.baseTexture._glRenderTargets[renderer.CONTEXT_UID];
            resolution = textureBuffer.resolution;
            frame = renderTexture.frame;
            flipY = false;
        } else {
            textureBuffer = renderer.rootRenderTarget;
            resolution = textureBuffer.resolution;
            flipY = true;
            frame = TEMP_RECT;
            frame.width = textureBuffer.size.width;
            frame.height = textureBuffer.size.height;
        }
        const width = frame.width * resolution;
        const height = frame.height * resolution;
        const canvasBuffer = new PIXI.CanvasRenderTarget(width, height);
        if (width) { // to avoid errors from getImageData()
            if (textureBuffer) {
                // bind the buffer
                renderer.bindRenderTarget(textureBuffer);
                // set up an array of pixels
                const webglPixels = new Uint8Array(BYTES_PER_PIXEL * width * height);
                // read pixels to the array
                const gl = renderer.gl;
                gl.readPixels(
                    frame.x * resolution,
                    frame.y * resolution,
                    width,
                    height,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    webglPixels,
                );
                // add the pixels to the canvas
                const canvasData = canvasBuffer.context.getImageData(0, 0, width, height);
                canvasData.data.set(webglPixels);
                canvasBuffer.context.putImageData(canvasData, 0, 0);
                // pulling pixels
                if (flipY) {
                    canvasBuffer.context.scale(1, -1);
                    canvasBuffer.context.drawImage(canvasBuffer.canvas, 0, -height);
                }
            }
        }
        // send the canvas back..
        return canvasBuffer.canvas;
    },

    /**
     * Creates a Canvas element, renders this target to it and then returns it.
     *
     * @param renderer
     * @param {PIXI.DisplayObject|PIXI.RenderTexture} target - A displayObject or renderTexture
     *  to convert. If left empty will use use the main renderer
     * @param eWidth
     * @param eHeight
     * @param clip
     * @return {HTMLCanvasElement} A Canvas element with the texture rendered on.
     */
    canvasExport(renderer, target, eWidth, eHeight, clip) {
        const TEMP_RECT = new PIXI.Rectangle();
        let context;
        let resolution;
        let frame;

        const renderTexture = getRenderTexture(renderer, target, eWidth, eHeight);

        if (renderTexture && !clip) {
            context = renderTexture.baseTexture._canvasRenderTarget.context;
            resolution = renderTexture.baseTexture._canvasRenderTarget.resolution;
            frame = renderTexture.frame;
        } else {
            context = renderer.rootContext;
            frame = TEMP_RECT;
            frame.width = renderer.width;
            frame.height = renderer.height;
        }
        const width = frame.width * resolution;
        const height = frame.height * resolution;
        const canvasBuffer = new PIXI.CanvasRenderTarget(width, height);
        if (width) { // to avoid errors from getImageData()
            const canvasData = context.getImageData(frame.x * resolution, frame.y * resolution, width, height);
            canvasBuffer.context.putImageData(canvasData, 0, 0);
        }

        // send the canvas back..
        return canvasBuffer.canvas;
    },
};

