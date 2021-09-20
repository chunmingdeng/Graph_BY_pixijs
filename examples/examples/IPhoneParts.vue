<template>
    <div class="canvas-container">
        <!-- 分析画布 -->
        <div id="renderArea" class="render-area"></div>
        <Spin size="large" fix v-if="spinShow"></Spin>
    </div>
</template>

<script>
    import graphZ from "../../src/";

    export default {
        data() {
            return {
                spinShow: false,
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
                this.spinShow = true;

                this.graphZ = graphZ({
                    container: 'renderArea'
                });

                this.graphZ.addRule({
                    nodeSelector: function(node) {
                        return node.getData("type") !== undefined;
                    },
                    nodeAttributes: {
                        icon: {
                             font: 'FontAwesome',
                             content: function(node) {
                                 const type = node.getData('type');

                                 if (type === 'part') {
                                     return '\uf013';
                                 } else if (type === 'manufacturer') {
                                     return '\uf1ad';
                                 } else if (type === 'device') {
                                     return '\uf10b';
                                 }
                             }
                        },
                        label: function(node) {
                            const type = node.getData('type');

                            if (type === 'device') {
                                return node.getData('name');
                            } else if (type === 'part') {
                                return node.getData('part_type');
                            } else if (type === 'manufacturer') {
                                return node.getData('name');
                            }
                        }
                    }
                });

                await this.graphZ.loadResources({ font: '/static/font/noto.fnt' });

                const chartDataResponse = await fetch('/static/data/iphone_parts.json');
                const chartData = await chartDataResponse.json();

                chartData.links = chartData.edges.map((edge) => {
                    return  {
                        fromId: edge.source,
                        toId: edge.target,
                        data: edge.data,
                        attributes: {},
                    }
                });

                this.graphZ.addNodes(chartData.nodes);
                this.graphZ.addEdges(chartData.links);
                this.graphZ.force().then(() => {
                    this.graphZ.setNodesToFullScreen();

                    this.spinShow = false;
                });
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
