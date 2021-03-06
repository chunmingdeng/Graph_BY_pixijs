import Layout from '../Layout.js';

export default class ForceLayout extends Layout {
    constructor(nodeSprites, edgeSprites, nodeContainer,visualConfig) {
        super(nodeSprites, edgeSprites, nodeContainer);
        this.NODE_WIDTH = visualConfig.NODE_WIDTH;
    };

    run() {
        return new Promise((resolve, reject) => {
            const forceWorker = new Worker('./ForceLayoutWorker.js', { type: 'module' });

            forceWorker.onmessage = event => {
                console.log('Force layout completed!');
                this.isLayouting = false;

                this.startTime = performance.now();

                this.endPositions = event.data.offSetArray;

                forceWorker.terminate();

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
            };
            forceWorker.postMessage(eventData, [
                eventData.incomingSlotArray.buffer,
                eventData.outgoingSlotArray.buffer,
                eventData.incomingTypedArrays.buffer,
                eventData.outgoingTypedArrays.buffer,
                eventData.nodesPositionArray.buffer,
            ]);
        });
    }
}
