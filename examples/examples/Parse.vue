<template>
    <div class="canvas-container">
        <!-- 分析画布 -->
        <div id="renderArea" class="render-area"></div>
    </div>
</template>

<script>
    import graphZ from "../../src/";
    import neo4j from 'neo4j-driver';

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

                // this.graphZ.parse.jsonFromUrl('/static/data/parseChartData.json').then((graph) => {
                //     this.graphZ.setGraph(graph);
                //     this.graphZ.setNodesToFullScreen();
                // })

                let driver = neo4j.driver('bolt://172.30.6.32:7687', neo4j.auth.basic('neo4j', 'zqykj'));
                let session = driver.session();
                let cypher = 'MATCH p=()-[r:DIRECTED]->() RETURN p LIMIT 25'
                session
                    .run(cypher)
                    .then((res) => {
                        return this.graphZ.parse.neo4j(res)
                    }).then((graph) => {
                        this.graphZ.setGraph(graph);
                        this.graphZ.layered().then(() => {
                            this.graphZ.setNodesToFullScreen();
                        });
                    }).then(() => {
                        session.close();
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
