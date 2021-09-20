import Layout from '../Layout.js';

export default class WASMGenerator extends Layout {
    constructor(nodeSprites, edgeSprites, nodeContainer,visualConfig) {
        super(nodeSprites, edgeSprites, nodeContainer);
        this.NODE_WIDTH = visualConfig.NODE_WIDTH;
    };

    run(wasmType) {
        return new Promise((resolve, reject) => {
            const worker = new Worker('./WASMWorker.js', { type: 'module' });

            worker.onmessage = event => {
                console.log('Force with WASM layout completed!');
                this.isLayouting = false;

                this.startTime = performance.now();

                this.endPositions = event.data.offSetArray;

                worker.terminate();
                // resolve();

                this.resolve = resolve;

                requestAnimationFrame(this.step.bind(this));
            };

            const eventData = {
                incomingSlotArray: this.incomingSlotArray,
                outgoingSlotArray: this.outgoingSlotArray,
                incomingTypedArrays: this.incomingTypedArrays,
                outgoingTypedArrays: this.outgoingTypedArrays,
                nodesPositionArray: this.nodesPositionArray,
                instanceCount: this.nodeContainer.instanceCount,
                wasmType,
            };
            worker.postMessage(eventData, [
                eventData.incomingSlotArray.buffer,
                eventData.outgoingSlotArray.buffer,
                eventData.incomingTypedArrays.buffer,
                eventData.outgoingTypedArrays.buffer,
                eventData.nodesPositionArray.buffer,
            ]);
        });
    }
}