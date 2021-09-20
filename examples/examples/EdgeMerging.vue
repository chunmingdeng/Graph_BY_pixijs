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
                this.graphZ = graphZ({
                    container: 'renderArea'
                });

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
