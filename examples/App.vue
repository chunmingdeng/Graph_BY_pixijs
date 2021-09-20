<template>
    <div class="main">
        <div class="nav-bar">
            <div class="title">GraphZ</div>
            <div class="menu-bar-horizontal">
                <router-link to="/introduction" :class="{'active': currentPage.includes('introduction')}">
                    介绍
                </router-link>
                <router-link to="/API" :class="{'active': currentPage.includes('API')}">
                    API
                </router-link>
                <router-link to="/tutorials" :class="{'active': currentPage.includes('tutorials')}">
                    教程
                </router-link>
                <router-link to="/examples" :class="{'active': currentPage.includes('examples')}">
                    示例
                </router-link>
            </div>
        </div>
        <router-view class="main-container"></router-view>
    </div>
</template>

<script>
    export default {
        data() {
            return {

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
        },
    }
</script>

<style lang="scss">
    html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
    }

    .main {
        width: 100%;
        height: 100%;

        .nav-bar {
            color: #fff;
            background-color: #1E1D32;
            height: 50px;

            display: flex;
            flex-direction: row;
            .title {
                height: 50px;
                line-height: 50px;
                font-size: 20px;
                font-weight: bold;

                padding: 0 40px;
            }

            .menu-bar-horizontal {
                height: 50px;
                overflow: hidden;
            }
            .menu-bar-horizontal a {
                float: left;
                text-align: center;
                padding: 14px 16px;
                text-decoration: none;
                font-size: 17px;
                color: white;
            }
            .menu-bar-horizontal a:hover {
                background-color: #514F6A;
            }
            .menu-bar-horizontal a.active {
                background-color: #514F6A;
            }
        }
    }

    .main-container {
        height: calc(100% - 50px);
    }


    ::-webkit-scrollbar {
        width: 4px;
        height: 4px;
    }
    ::-webkit-scrollbar-button {
        width: 0;
        height: 0;
    }
    ::-webkit-scrollbar-thumb {
        background: #666666;
        border: 0;
        border-radius: 50px;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: #000000;
    }
    ::-webkit-scrollbar-thumb:active {
        background: #000000;
    }
    ::-webkit-scrollbar-track {
        background: #DEDEDE;
        border: 0;
        border-radius: 50px;
    }
    ::-webkit-scrollbar-track:hover {
        background: #DEDEDE;
    }
    ::-webkit-scrollbar-track:active {
        background: #DEDEDE;
    }
    ::-webkit-scrollbar-corner {
        background: transparent;
    }

</style>
