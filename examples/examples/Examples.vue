<template>
    <div class="example-container">
        <div class="menu-bar-vertical">
            <Menu theme="dark" :active-name="activeMenuItem" :open-names="['actual-samples']" width="180px" @on-select="selectMenu">
                <Submenu name="actual-samples">
                    <template slot="title">
                        <Icon type="ios-paper" />
                        实际样例
                    </template>
                    <MenuItem name="sample-1">
                        简单
                    </MenuItem>
                    <MenuItem name="sample-iPhone-parts">
                        iPhone零部件
                    </MenuItem>
                    <MenuItem name="sample-transport-network">
                        交通网络
                    </MenuItem>
                </Submenu>
<!--                <Submenu name="operations">-->
<!--                    <template slot="title">-->
<!--                        <Icon type="ios-paper" />-->
<!--                        图操作-->
<!--                    </template>-->
<!--                    <MenuItem name="operation-1">-->
<!--                        <router-link to="/examples/simple">简单</router-link>-->
<!--                    </MenuItem>-->
<!--                </Submenu>-->
                <Submenu name="node-style">
                    <template slot="title">
                        <Icon type="ios-paper" />
                        实体样式
                    </template>
                    <MenuItem name="node-icon-color">
                        颜色图标
                    </MenuItem>
                    <MenuItem name="node-icon-font">
                        字体图标
                    </MenuItem>
                    <MenuItem name="node-icon-image">
                        图片图标
                    </MenuItem>
                </Submenu>
                <Submenu name="graph-style">
                    <template slot="title">
                        <Icon type="ios-paper" />
                        图样式
                    </template>
                    <MenuItem name="graph-style-style">
                        样式
                    </MenuItem>
                    <MenuItem name="graph-style-badge">
                        角标
                    </MenuItem>
                </Submenu>
                <Submenu name="graph-layout">
                    <template slot="title">
                        <Icon type="ios-paper" />
                        图布局
                    </template>
                    <MenuItem name="graph-layout-1">
                        布局
                    </MenuItem>
                </Submenu>
                <Submenu name="parse">
                    <template slot="title">
                        <Icon type="ios-paper" />
                        图数据加载
                    </template>
                    <MenuItem name="parse-neo4j">
                        Neo4j
                    </MenuItem>
                </Submenu>
                <Submenu name="transformation">
                    <template slot="title">
                        <Icon type="ios-paper" />
                        图转换
                    </template>
                    <MenuItem name="node-merging">
                        顶点聚合
                    </MenuItem>
                    <MenuItem name="edge-merging">
                        边聚合
                    </MenuItem>
                </Submenu>
                <Submenu name="export">
                    <template slot="title">
                        <Icon type="ios-paper" />
                        图数据导出
                    </template>
                    <MenuItem name="export-json">
                        json
                    </MenuItem>
                    <MenuItem name="export-png">
                        png
                    </MenuItem>
                </Submenu>
            </Menu>
        </div>
        <router-view class="main-content"></router-view>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                activeMenuItem: "sample-1",
            };
        },
        computed: {
            currentPage() {
                return this.$route.path;
            },
        },
        created() {
        },
        mounted() {
        },
        methods: {
            selectMenu(name) {
                switch (name) {
                    case 'sample-1':
                        this.$router.push("/examples/simple");
                        break;
                    case 'sample-iPhone-parts':
                        this.$router.push("/examples/iphone-parts");
                        break;
                    case 'sample-transport-network':
                        this.$router.push("/examples/transport-network");
                        break;

                    case 'node-icon-color':
                        this.$router.push("/examples/color");
                        break;
                    case 'node-icon-font':
                        this.$router.push("/examples/font");
                        break;
                    case 'node-icon-image':
                        this.$router.push("/examples/resource");
                        break;

                    case 'graph-style-style':
                        this.$router.push("/examples/styles");
                        break;
                    case 'graph-style-badge':
                        this.$router.push("/examples/badge");
                        break;

                    case 'graph-layout-1':
                        this.$router.push("/examples/layout");
                        break;

                    case 'parse-neo4j':
                        this.$router.push("/examples/parse");
                        break;

                    case 'node-merging':
                        this.$router.push("/examples/node-merging");
                        break;
                    case 'edge-merging':
                        this.$router.push("/examples/edge-merging");
                        break;

                    case 'export-json':
                        this.$router.push("/examples/export-json");
                        break;
                    case 'export-png':
                        this.$router.push("/examples/export-png");
                        break;

                }

            }
        },
    }
</script>

<style lang="scss">
    .example-container {
        height: calc(100% - 50px);

        display: flex;
        flex-direction: row;

        .menu-bar-vertical {
            background-color: #f1f1f1;
            width: 180px;

            overflow-x: hidden;
            overflow-y: scroll;
            a {
                color: #f1f1f1;
                text-decoration: none;
            }
        }
    }

    /* Style buttons */
    .btn {
        background-color: #314F6A; /* Blue background */
        border: none; /* Remove borders */
        color: white; /* White text */
        padding: 12px 16px; /* Some padding */
        font-size: 16px; /* Set a font size */
        cursor: pointer; /* Mouse pointer on hover */
    }

    /* Darker background on mouse-over */
    .btn:hover {
        background-color: #222a6A;
    }

</style>
