export default class Exports {
    constructor(self) {
        this.self = self;
    }

    /**
     * export json
     * @returns {Promise<string>}
     */
    async json() {
        const allEdges = _.cloneDeep(this.self.getEdges());
        const allNodes = _.cloneDeep(this.self.getNodes());
        const jsonData = { nodes: allNodes, edges: allEdges };

        // 第三个参数为数字，则字符串化中的每个级别都将缩进这个数量的空格字符
        return JSON.stringify(jsonData, null , 2);
    }

    /**
     *
     * @param width {number}
     * @param height {number}
     * @param clip {boolean}
     * @returns {Promise<string>}
     */
    async png(width, height, clip = false) {
        const renderer = this.self.renderer;
        return await renderer.exportImage(width, height, clip);
    }
}
