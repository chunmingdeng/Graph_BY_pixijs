import Transformation from './Transformation'

export default class Transformations {
    constructor();
    /**
     * @param options {object}
     * @param graphZ
     * @param options.selector {function} By default, all the edges will be assigned a group.
     * @param options.generator  must return the new edge to be added.
     */
    addEdgeGrouping(options: {} | undefined, graphZ: any): Transformation;
}
