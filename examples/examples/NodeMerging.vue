<template>
    <div class="canvas-container">
        <!-- 分析画布 -->
        <div id="renderArea" class="render-area"></div>
    </div>
</template>

<script>
    import graphZ from "../../src/";

    export default {
        data() {
            return {

            };
        },
        created() {

        },
        mounted() {
            this.init();
        },
        methods: {
            async init() {
                function randomGraph(N, E) {
                    const LOCATION = ['France', 'Russia', 'USA'];

                    const FLAGS = {
                        'France': 'flags/fr.svg',
                        'Russia': 'flags/ru.svg',
                        'USA': 'flags/us.svg',
                    };

                    const g = {nodes:[], edges:[]};

                    for (let i = 0; i < N; i++) {
                        const location = LOCATION[(Math.random() * LOCATION.length | 0)];
                        g.nodes.push({
                            id: 'n' + i,
                            attributes: {
                                x: Math.random() * 100,
                                y: Math.random() * 100,
                                text: 'Node ' + i + ' - ' + location,
                                image: {
                                    url: FLAGS[location]
                                }
                            },
                            data: {
                                location: location
                            }
                        });
                    }

                    for (let i = 0; i < E; i++) {
                        g.edges.push({
                            id: 'e' + i,
                            source: 'n' + (Math.random() * N | 0),
                            target: 'n' + (Math.random() * N | 0)
                        });
                    }

                    return g;
                }

                const g = randomGraph(10, 10);

                this.graphZ = graphZ({
                    container: 'renderArea'
                });

                this.graphZ.addNodes(g.nodes);
                this.graphZ.addEdges(g.edges);

                await this.graphZ.loadResources({ font: '/static/font/noto.fnt' });

                const chartDataResponse = await fetch('/static/data/transformationChartData.json');
                const chartData = await chartDataResponse.json();

                this.graphZ.addNodes(chartData.nodes);
                this.graphZ.addEdges(chartData.links);
                this.graphZ.setNodesToFullScreen();
                this.graphZ.transformations.addEdgeGrouping({
                    selector: function(edge){
                        return edge.getData("label") !== void 0;
                    },
                    generator: function(){
                        return {
                            "data": {
                                "type": "study_at",
                                "label": "合并的链接",
                                "isDirected": true
                            },
                            "attributes": {
                                "lineWidth": 5.0,
                                "color": "#cdb79e"
                            }
                        };
                    }
                }, this.graphZ);
            },
        },
    }
</script>

<style lang="css">
    .canvas-container {
        width: 100%;
        height: 100%;
    }

    .render-area {
        width: 100%;
        height: 100%;
    }

</style>
