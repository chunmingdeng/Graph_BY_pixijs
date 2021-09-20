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
                        label: function(node) {
                            return node.getData('latin_name');
                        }
                    }
                });

                await this.graphZ.loadResources({ font: '/static/font/noto.fnt' });

                const chartDataResponse = await fetch('/static/data/paris-metro.json');
                const chartData = await chartDataResponse.json();

                chartData.nodes.forEach((node) => {
                    node.attributes['x'] = node['x'];
                    node.attributes['y'] = node['y'];
                });

                chartData.edges.forEach((edge) => {
                    edge.fromId = edge.source;
                    edge.toId = edge.target;
                });

                this.graphZ.addNodes(chartData.nodes);
                this.graphZ.addEdges(chartData.edges);
                this.graphZ.setNodesToFullScreen();

                this.spinShow = false;
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
