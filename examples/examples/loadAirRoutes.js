import Papa from "papaparse";

export default function () {
    return new Promise((resolve => {
        Papa.parse("/static/data/air-routes-latest-nodes.csv", {
            download: true,
            skipEmptyLines: true,
            header: true,
            transformHeader: function(h) {
                h = h.startsWith('~') ? h.substring(1) : h;

                const delimiterIndex = h.indexOf(':');
                return delimiterIndex < 0 ? h : h.substring(0, delimiterIndex);
            },
            complete: function (entities) {

                Papa.parse("/static/data/air-routes-latest-edges.csv", {
                    download: true,
                    skipEmptyLines: true,
                    header: true,
                    transformHeader: function(h) {
                        h = h.startsWith('~') ? h.substring(1) : h;

                        const delimiterIndex = h.indexOf(':');
                        return delimiterIndex < 0 ? h : h.substring(0, delimiterIndex);
                    },
                    complete: function (edges) {

                        const nodes = entities.data.map((node) => {
                            return  {
                                id: node.id,
                                data: {
                                    type: "plane",
                                    label: node.code,
                                },
                                attributes: {},
                            }
                        });

                        const links = edges.data.map((edge) => {
                            return  {
                                id: edge.id,
                                fromId: edge.from,
                                toId: edge.to,
                                data: {
                                    type: "plane_link",
                                    label: edge.label,
                                    isDirected: true,
                                },
                                attributes: {},
                            }
                        });

                        resolve({
                            nodes,
                            links
                        });
                    }
                })
            }
        })
    }));
}
