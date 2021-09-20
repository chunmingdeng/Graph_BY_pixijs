import "core-js/stable";
import "regenerator-runtime/runtime";

import Vue from 'vue';
import VueRouter from 'vue-router';

import iView from 'iview';
import 'iview/dist/styles/iview.css';

import App from './App.vue';

import Introduction from "./Introduction.vue";

import API from "./API/API.vue";

import Tutorials from "./tutorials/Tutorials.vue";

import Examples from "./examples/Examples.vue";

import Simple from "./examples/Simple.vue";
import IPhoneParts from "./examples/IPhoneParts.vue";
import TransportNetwork from "./examples/TransportNetwork.vue";

import ColorIcon from "./examples/ColorIcon.vue";
import FontIcon from "./examples/FontIcon.vue";
import Resource from "./examples/Resource.vue";

import Layout from "./examples/Layout.vue";

import Styles from "./examples/Styles.vue";
import Badge from "./examples/Badge.vue";

import parse from "./examples/Parse.vue";

import NodeMerging from "./examples/NodeMerging.vue";
import EdgeMerging from "./examples/EdgeMerging.vue";

import ExportJSON from "./examples/ExportJSON.vue"
import ExportPNG from "./examples/ExportPNG.vue"

Vue.use(VueRouter);
Vue.use(iView);

// 开启debug模式
Vue.config.debug = true;

const routes = [
    {
        path: '',
        redirect: '/introduction',
    },
    {
        name: 'introduction',
        path: '/introduction',
        component: Introduction,
    },
    {
        name: 'API',
        path: '/API',
        // component: { template: '<router-view></router-view>'},
        component: API,
    },
    {
        name: 'tutorials',
        path: '/tutorials',
        component: Tutorials,
    },
    {
        name: 'examples',
        path: '/examples',
        component: Examples,
        children: [
            {
                path: '',
                redirect: '/examples/simple',
            },
            {
                path: 'simple',
                component: Simple,
            },
            {
                path: 'iphone-parts',
                component: IPhoneParts,
            },
            {
                path: 'transport-network',
                component: TransportNetwork,
            },
            {
                path: 'resource',
                component: Resource,
            },
            {
                path: 'color',
                component: ColorIcon,
            },
            {
                path: 'font',
                component: FontIcon,
            },
            {
                path: 'layout',
                component: Layout,
            },
            {
                path: 'styles',
                component: Styles,
            },
            {
                path: 'badge',
                component: Badge,
            },
            {
                path: 'parse',
                component: parse,
            },

            {
                path: 'node-merging',
                component: NodeMerging,
            },
            {
                path: 'edge-merging',
                component: EdgeMerging,
            },
            {
                path: 'export-json',
                component: ExportJSON,
            },
            {
                path: 'export-png',
                component: ExportPNG,
            },
        ],
    },
];

const router = new VueRouter({
    // mode: 'history',
    linkActiveClass: 'active',
    routes // short for `routes: routes`
});

const app = new Vue({
    render: (h) => h(App),
    router,
}).$mount('#app');
