<template>
    <div class="canvas-container">
        <!-- 分析画布 -->
        <div class="action-container">
            <button class="btn" @click.prevent.stop="forceLayout"> 网络</button>
            <button class="btn" @click.prevent.stop="forceLayoutWASM"> 网络(WASM)</button>
            <button class="btn" @click.prevent.stop="circleLayout"> 圆形</button>
            <button class="btn" @click.prevent.stop="circleLayoutWASM"> 圆形(WASM)</button>
            <button class="btn" @click.prevent.stop="radiateLayout"> 辐射</button>
            <button class="btn" @click.prevent.stop="rotateLayoutWASM"> 旋转(WASM)</button>
            <button class="btn" @click.prevent.stop="structuralLayout"> 结构</button>
            <button class="btn" @click.prevent.stop="layeredLayout"> 层次</button>
            <button class="btn" @click.prevent.stop="spreadLayoutWASM"> 放大(WASM)</button>
            <button class="btn" @click.prevent.stop="shrinkLayoutWASM"> 缩小(WASM)</button>

            <span> / </span>

            <button class="btn" @click.prevent.stop="zoomIn"> 画布放大</button>
            <button class="btn" @click.prevent.stop="zoomOut"> 画布缩小</button>

            <span> / </span>

            <button class="btn" @click.prevent.stop="toggleMode"> 拖动/选中</button>

            <span> / </span>

            <select v-model="dataSource" @change="loadChart">
                <option disabled value="">Please select one</option>
                <option>smallChartData</option>
                <option>chartData</option>
                <option>bigChartData</option>
                <option>airRoutes</option>
            </select>
            <span>Selected: {{ dataSource }}</span>
        </div>
        <div id="renderArea" class="render-area"></div>
        <Spin size="large" fix v-if="spinShow"></Spin>
        <right-menu
                ref="menu"
                class="graph-rm"
                :data="rightMenuData"
                :is-italic-mode="isItalicMode"
                :entity-icon-url="entityIconUrl"
                @menu-click="handleMenuClick">
        </right-menu>
    </div>
</template>

<script>
    import loadAirRoutes from "./loadAirRoutes";
    import graphZ from "../../src/";
    import RightMenu from "../rightMenu/RightMenu.vue";
    import RightMenuData from "../rightMenu/RightMenuData";

    export default {
        data() {
            return {
                dataSource: 'chartData',
                spinShow: false,
                entityIconUrl: '',
                rightMenuData: [],
                contextMenuTarget: null
            };
        },
        created() {

        },
        computed: {
            isItalicMode() {
                return parseInt(navigator.userAgent.toLowerCase().split('chrome/')[1], 10) > 56;
            },
        },
        mounted() {
            this.init();
            this.stopRightMenu();
        },
        components: {
            RightMenu,
        },
        methods: {
            async init() {
                const globalELPModelResponse = await fetch('/static/data/globalELPModel.json');
                const globalELPModel = await globalELPModelResponse.json();

                this.graphZ = graphZ({
                    container: 'renderArea'
                });

                this.graphZ.events.on('contextmenu', (e)=> {
                    console.log('contextmenu event caught!');
                    this.rightUpHandler(e)
                });

                const iconMap = globalELPModel.entities.reduce((accumulator, entity) => {
                    accumulator[entity.uuid] = `/static/images${entity.iconUrl}`;
                    return accumulator;
                }, {});

                this.graphZ.addRule({
                    nodeAttributes: {
                        image: {
                            field: 'type',
                            values: iconMap
                        }
                    }
                });

                this.graphZ.loadResources({ font: '/static/font/noto.fnt' }).then(() => {
                    this.loadChart();
                });
            },

            async loadChart() {
                this.spinShow = true;

                this.graphZ.clearGraph();

                let chartData;
                if (this.dataSource === 'airRoutes') {
                    chartData = await loadAirRoutes();
                } else {
                    const chartDataResponse = await fetch(`/static/data/${this.dataSource}.json`);
                    chartData = await chartDataResponse.json();
                }

                this.graphZ.addNodes(chartData.nodes);
                this.graphZ.addEdges(chartData.links);
                this.graphZ.setNodesToFullScreen();

                this.spinShow = false;
            },

            forceLayout() {
                this.graphZ.force().then(() => {
                    // this.graphZ.setNodesToFullScreen();
                });
            },

            circleLayout() {
                this.graphZ.circle().then(() => {
                    // this.graphZ.setNodesToFullScreen();
                });
            },

            radiateLayout() {
                this.graphZ.radiate().then(() => {
                    // this.graphZ.setNodesToFullScreen();
                });
            },

            structuralLayout() {
                this.graphZ.structural().then(() => {
                    // this.graphZ.setNodesToFullScreen();
                });
            },

            layeredLayout() {
                this.graphZ.layered().then(() => {
                    // this.graphZ.setNodesToFullScreen();
                });
            },

            forceLayoutWASM() {
                this.graphZ.WASMLayout('force').then(() => {
                    // this.graphZ.setNodesToFullScreen();
                });
            },

            circleLayoutWASM() {
                this.graphZ.WASMLayout('circle').then(() => {
                    // this.graphZ.setNodesToFullScreen();
                });
            },

            rotateLayoutWASM() {
                this.graphZ.WASMLayout('rotate').then(() => {
                    // this.graphZ.setNodesToFullScreen();
                });
            },

            spreadLayoutWASM() {
                this.graphZ.WASMLayout('spread').then(() => {
                    // this.graphZ.setNodesToFullScreen();
                });
            },

            shrinkLayoutWASM() {
                this.graphZ.WASMLayout('shrink').then(() => {
                    // this.graphZ.setNodesToFullScreen();
                });
            },

            zoomIn() {
                this.graphZ.zoomIn();
            },

            zoomOut() {
                this.graphZ.zoomOut();
            },

            toggleMode() {
                this.graphZ.toggleMode();
            },

            /**
             * 菜单点击的回调函数  右键菜单
             * @param {object} node  点击得菜单节点数据
             * @param {object} event 鼠标点击事件对象
             */
            handleMenuClick(node, event) {
                console.log(node, event)
            },

            // 阻止浏览器右键菜单
            stopRightMenu() {
                document.oncontextmenu = (e) => {
                    let event = e || window.event;
                    if (event && event.returnValue) {
                        event.preventDefault();
                    } else {
                        event.returnValue = false;
                    }
                }
            },

            // 右键菜单相关
            rightUpHandler(e) {
                const type = e.type;
                const event = e.original;
                if (type === 'blank') {
                    this.blankRightUpHandler();
                } else if (type === 'node') {
                    this.nodeRightUpHandler();
                } else if (type === 'edge') {
                    this.edgeRightUpHandler();
                }
                const originalEvent = event.data.originalEvent;
                this.$refs.menu.showMenu(originalEvent.pageX, originalEvent.pageY);
                this.contextMenuTarget = e.target;
            },

            blankRightUpHandler() {
                this.rightMenuData = [].concat(RightMenuData.blank);
                this.entityIconUrl = '/static/images/rightMenuIcons/rm_blank.png';
            },

            nodeRightUpHandler() {
                this.rightMenuData = [].concat(RightMenuData.entity);
                this.entityIconUrl = '/static/images/rightMenuIcons/rm_blank.png';
            },

            edgeRightUpHandler() {
                this.rightMenuData = [].concat(RightMenuData.edge);
                this.entityIconUrl = '/static/images/rightMenuIcons/rm_edge.png';
            }
        },
    }
</script>

<style lang="scss">
.canvas-container {
    position: relative;
    width: 100%;
    height: 100%;
}

.render-area {
    width: 100%;
    height: 100%;
}

.action-container {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 20;
}

</style>
