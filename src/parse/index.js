import * as rowData from '../core/RawData'

export default class Parse {
    constructor() {}

    /**
     * @param json {string} -- JSON string
     * @returns {Promise<RawGraph>}
     */
    async json(json) {
        let type = Object.prototype.toString.call(json).slice(8, -1);
        let jsonData;
        if (type === 'String') {
            try {
                jsonData = JSON.parse(json);
            } catch (e) {
                throw Error(`传入的json字符串非法，原因：${e}`)
            }
        } else if (type === 'Object') {
            jsonData = json;
        } else {
            console.warn('请传入正确格式')
        }
        return this._initJSON(jsonData);
    }

    /**
     * @param url -- JSON file
     * @returns {Promise<RawGraph>}
     */
    async jsonFromUrl(url) {
        if (typeof url !== 'string') {
            throw Error('请传入正确的url');
        }
        const chartDataResponse = await fetch(url);
        if (chartDataResponse.status !== 200 || !chartDataResponse.ok) {
            throw Error('请传入正确的url地址');
        }
        const chartData = await chartDataResponse.json();
        return this._initJSON(chartData);
    }

    _initJSON(jsonData) {
        const { nodes: nodeList, edges: edgeList } = jsonData;
        let rawNodeList = [];
        let rowEdgeList = [];

        if (nodeList) {
            for (let node of nodeList) {
                const rowNode = new rowData.RawNode(node.id, node.data, node.attributes);
                rawNodeList.push(rowNode);
            }
        }
        if (edgeList) {
            for (let edge of edgeList) {
                const rowEdge = new rowData.RawEdge(edge.id, edge.fromId, edge.toId, edge.data, edge.attributes);
                rowEdgeList.push(rowEdge);
            }
        }

        return new rowData.RawGraph(rawNodeList, rowEdgeList);
    }

    /**
     * @param response -- Response of the Neo4j Bolt driver.
     *                    doc address: https://neo4j.com/docs/api/javascript-driver/current/
     * @returns {Promise<RawGraph>}
     */
    async neo4j(response) {
        let type = Object.prototype.toString.call(response).slice(8, -1);
        let records;
        if (type === 'Object') {
            records = response.records ? response.records : [];
        } else if (type === 'Array') {
            records = response;
        }
        let rawNodeList = [];
        let rowEdgeList = [];
        const setNode = (node) => {
            let id = node.identity.toString();
            let data = {
                labels: node.labels
            };
            const rowNode = new rowData.RawNode(id, data, node.properties);
            const index = rawNodeList.findIndex(item => item.id === id);
            if (index === -1) {
                rawNodeList.push(rowNode);
            }
        };
        const setEdge = (edge) => {
            let id = edge.identity.toString();
            let fromId = edge.start.toString();
            let toId = edge.end.toString();
            let data = {
                type: edge.type
            };
            const rowEdge = new rowData.RawEdge(id, fromId, toId, data, edge.properties);
            const index = rowEdgeList.findIndex(item => item.id === id);
            if (index === -1) {
                rowEdgeList.push(rowEdge);
            }
        };
        for (let record of records) {
            const fields = record._fields;
            for (let field of fields) {
                if (field.__isNode__) { // Class for Node Type.
                    setNode(field);
                } else if (field.__isRelationship__) { // Class for Relationship Type.
                    setEdge(field);
                } else if (field.__isPath__) { // Class for Path Type.
                    setNode(field.start);
                    setNode(field.end);
                    if (!field.segments) continue;
                    for (let path of field.segments) { // Class for PathSegment Type.
                        setNode(path.start);
                        setNode(path.end);
                        setEdge(path.relationship);
                    }
                }
            }
        }
        return new rowData.RawGraph(rawNodeList, rowEdgeList);
    }
}
