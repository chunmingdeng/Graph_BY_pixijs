import Transformation, { TRANSFORMATION_TYPES } from './Transformation'
import { RawEdge } from '../core/RawData'

export default class Transformations {
    constructor(self) {
        this.self = self;

        this.transformations = [];
    }

    /**
     * 清空已经添加的转换
     */
    clear() {
        this.transformations = [];
    }

    /**
     * 返回已经添加的转换
     * @returns {[]|*[]}
     */
    getList() {
        return this.transformations;
    }

    /**
     * @param options {object}
     * @param options.selector {function} By default, all the edges will be assigned a group.
     * @param options.generator  must return the new edge to be added.
     */
    addEdgeGrouping(options = {}) {
        const allEdges = _.cloneDeep(this.self.getEdges());
        let filterEdges = [];
        const { selector, generator } = options;
        if (selector && typeof selector === 'function') {
            for (const edge of allEdges) {
                try {
                    let call = selector(edge);
                    if (!call) continue;
                    filterEdges.push(edge);
                } catch (e) {
                    filterEdges = allEdges; // if throw error, apply allEdges
                    console.warn(e)
                }
            }
        } else {
            filterEdges = allEdges;
        }
        const edges = {};
        for (const edge of filterEdges) { // put the same formId and toId's edges together
            const concatId = edge.fromId + edge.toId;
            if (!edges[concatId]) {
                edges[concatId] = [edge];
            } else {
                edges[concatId].push(edge);
            }
        }
        for (let item of Object.values(edges)) { // Iterate the repeating edges
            if (item.length >= 2) {
                for (let edge of item) {
                    this.self.removeEdge(edge);
                }
                const { fromId, toId } = item[0];
                const currentTime = new Date().getTime();
                const id = `${fromId}~\`#${toId}~\`#${currentTime}`;
                if (generator && typeof generator === 'function') {
                    const { data, attributes } = generator.apply(this.self, arguments);
                    const rawEdge = new RawEdge(id, fromId, toId, data, attributes);
                    this.self.addEdge(rawEdge)
                } else {
                    const attributes = {};
                    const data = {};
                    const rawEdge = new RawEdge(id, fromId, toId, data, attributes);
                    this.self.addEdge(rawEdge)
                }
            }
        }

        const edgeGrouping = new Transformation(TRANSFORMATION_TYPES.EDGE_GROUPING, options);
        this.transformations.push(edgeGrouping);

        return edgeGrouping;
    }
}
