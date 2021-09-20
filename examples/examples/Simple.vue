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

                const chartDataResponse = await fetch('/static/data/demoChartData.json');
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
