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
            const font = '900 96px "Font Awesome 5 Free"';
            document.fonts.load(font).then((_) => {
                this.init();
            });
        },
        methods: {
            async init() {
                this.graphZ = graphZ({
                    container: 'renderArea'
                });

                const iconMapResponse = await fetch('/static/data/globalIconMap.json');
                const iconMap = await iconMapResponse.json();
                this.graphZ.addRule({
                    nodeSelector: function(node) {
                        return node.getData("type") !== undefined;
                    },
                    nodeAttributes: {
                        image: {
                            field: 'type',
                            values: iconMap
                        },
                        borderColor: "#7777ff",
                        scale: 2.0,
                        "badges": {
                            "topLeft": {
                                "image": "/static/images/Person/Man.png",
                                "text": {
                                    "content": "\uf007",
                                    "font": "Font Awesome 5 Free"
                                }
                            },
                            "topRight": {
                                "image": "",
                                "text": {
                                    "content": "",
                                    "font": "Font Awesome 5 Free"
                                }
                            },
                            "bottomLeft": {
                                "image": "",
                                "text": {
                                    "content": "\uf007",
                                    "font": "Font Awesome 5 Free"
                                }
                            },
                            "bottomRight": {
                                "image": "./src/assets/images/subscript/lock_state.png",
                                "text": {
                                    "content": "\uf007",
                                    "font": "Font Awesome 5 Free"
                                }
                            }
                        }
                    }
                });
                this.graphZ.addRule({
                    edgeSelector: function(edge) {
                        return edge.getData("type") !== undefined;
                    },
                    edgeAttributes: {
                        lineWidth: 2.0,
                        color: "#7aff11"
                    }
                });

                await this.graphZ.loadResources({ font: '/static/font/noto.fnt' });

                const chartDataResponse = await fetch('/static/data/stylesChartData.json');
                const chartData = await chartDataResponse.json();

                this.graphZ.addNodes(chartData.nodes);
                this.graphZ.addEdges(chartData.links);
                this.graphZ.setNodesToFullScreen();
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
