<template>
    <div class="canvas-container">
        <!-- 分析画布 -->
        <div id="renderArea" class="render-area"></div>
        <Button type="primary" class="btn-export" @click="exportPNG">导出PNG</Button>
    </div>
</template>

<script>
    import graphZ from "../../src/";

    export default {
        data() {
            return {
                png: ''
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

                const chartDataResponse = await fetch('/static/data/parseChartData.json');
                const chartData = await chartDataResponse.json();

                this.graphZ.addNodes(chartData.nodes);
                this.graphZ.addEdges(chartData.edges);
                this.graphZ.setNodesToFullScreen();

            },
            async exportPNG() {
                this.png = await this.graphZ.export.png(window.outerWidth, window.outerHeight, true);
                let eleLink = document.createElement('a');
                eleLink.download = 'graph.png';
                eleLink.style.display = 'none';
                eleLink.href = this.png;
                // 触发点击
                document.body.appendChild(eleLink);
                eleLink.click();
                // 然后移除
                document.body.removeChild(eleLink);
            }
        },
    }
</script>

<style lang="css">
    .canvas-container {
        position: relative;
        width: 100%;
        height: 100%;
    }

    .render-area {
        width: 100%;
        height: 100%;
    }
    .btn-export {
        position: absolute;
        top: 10px;
        left: 10px;
    }

</style>
