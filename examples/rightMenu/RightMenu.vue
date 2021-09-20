<template>
    <div v-if="showMenus" class="circular-menus" :style="positonStyle">
        <!-- inner menus -->
        <div class="inner-menus">
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="-2 -2 504 504" class="mc-svg" :transform="isRotate">
                <!-- circles -->
                <circle v-if="innerMenuSize === 1" class="single-fill" :cx="singleWidth" :cy="singleWidth" :r="singleWidth" @click="menuClick(menus[0], 0, $event)"></circle>
                <text v-if="innerMenuSize === 1" fill="#fff" x="50%" y="122" text-anchor="middle" font-size="24px">{{ menus[0].label }}</text>
                <image v-if="innerMenuSize === 1" x="230" y="43" height="40" width="40" :xlink:href="menus[0].icon | getIcons"/>
                <g v-if="innerPath">
                    <a
                        v-for="(m, i) in menus"
                        data-svg-origin="250 250"
                        role="link"
                        :class="['mc-circular', {'active': m.active}]"
                        :key="m.id"
                        :transform="`rotate(${rotateBase * (i - 1)}, 250, 250)`"
                        :xlink:title="m.label"
                        @click="menuClick(m, i, $event)">
                        <!-- clip path -->
                        <path class="mc-sector" :d="innerPath"></path>
                        <!-- create labels & icons of menus -->
                        <use
                            :xlink:href="`#label-${i}`"
                            xmlns:xlink="http://www.w3.org/1999/xlink"
                            width="40"
                            height="40"
                            :x="labelPoint | getPosition(i, 'cx')"
                            :y="labelPoint | getPosition(i, 'cy')"
                            :transform="i | getTransform(rotateBase, needRotate)">
                        </use>
                        <use
                            :xlink:href="`#icon-${i}`"
                            xmlns:xlink="http://www.w3.org/1999/xlink"
                            width="40"
                            height="40"
                            :x="iconPoint | getPosition(i, 'cx')"
                            :y="iconPoint | getPosition(i, 'cy')"
                            :transform="i | getTransform(rotateBase, needRotate)">
                        </use>
                    </a>
                </g>
                <!-- labels & icons -->
                <g v-if="innerPath" class="mc-symbols">
                    <symbol v-for="(m, i) in menus" :id="`label-${i}`" viewBox="0 0 40 40">
                        <text fill="#fff" x="50%" y="50%" dy=".3em" text-anchor="middle" font-size="24px">{{ m.label }}</text>
                    </symbol>
                    <symbol v-for="(m, i) in menus" :id="`icon-${i}`" viewBox="0 0 40 40">
                        <image x="50%" y="50%" height="40" width="40" :xlink:href="m.icon | getIcons"/>
                    </symbol>
                </g>
                <!-- center icon -->
                <g class="menu-circle" role="button">
                    <circle cx="250" cy="250" r="88"></circle>
                    <image :x="objectX" :y="objectY" height="64" width="64" :xlink:href="entityIconUrl" :transform="objectRotate"/>
                </g>
            </svg>
        </div>
        <!-- outer menus -->
        <div v-if="outerMenuSize && showOuterMenus" class="outer-menus">
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="-2 -2 504 504" class="mc-svg mc-outer" :transform="isRotate">
                <!-- circles -->
                <g>
                    <a
                        v-for="(m, i) in childs"
                        data-svg-origin="250 250"
                        role="link"
                        class="mc-circular"
                        :key="m.id"
                        :transform="`rotate(${m.rotate}, 250, 250)`"
                        :xlink:title="m.label"
                        @click="menuClick(m, i, $event)">
                        <path fill="none" stroke="#111" :d="paths.outer" class="mc-sector"></path>
                        <!-- create labels & icons of menus -->
                        <use
                            :xlink:href="`#outer-label-${i}`"
                            xmlns:xlink="http://www.w3.org/1999/xlink"
                            width="40"
                            height="40"
                            x="430"
                            y="180"
                            :transform="i | getTransform(rotateBase, needRotate, innerMenuSize, outerMenuSize, currentInnerMenuIndex, isItalicMode)">
                        </use>
                        <use
                            :xlink:href="`#outer-icon-${i}`"
                            xmlns:xlink="http://www.w3.org/1999/xlink"
                            width="40"
                            height="40"
                            x="416"
                            y="136"
                            :transform="i | getTransform(rotateBase, needRotate, innerMenuSize, outerMenuSize, currentInnerMenuIndex, isItalicMode)">
                        </use>
                    </a>
                </g>
                <!-- labels & icons -->
                <g class="mc-symbols">
                    <symbol v-for="(m, i) in childs" :id="`outer-label-${i}`" viewBox="0 0 40 40">
                        <text fill="#fff" x="50%" y="50%" dy=".3em" text-anchor="middle" font-size="15px">{{ m.label }}</text>
                    </symbol>
                    <symbol v-for="(m, i) in childs" :id="`outer-icon-${i}`" viewBox="0 0 40 40">
                        <image x="50%" y="50%" height="26" width="26" :xlink:href="m.icon | getIcons"/>
                    </symbol>
                </g>
            </svg>
        </div>
    </div>
</template>

<script>
import InnerPoints from './InnerPoints';
import InnerRotatePoints from './InnerRotatePoints';

export default {
    name: 'menus',
    data() {
        return {
            childs: [], // 二级菜单
            innerWidth: 240, // 一级菜单宽度
            currentInnerMenuIndex: 0, // 点击的一级菜单index
            currentInnerMenuId: '', // 点击的一级菜单id
            showOuterMenus: false,
            showMenus: false, // 是否显示环形菜单
        };
    },
    props: {
        data: { // 数据
            type: Array,
            default() {
                return [];
            },
        },
        entityIconUrl: { // 中心实体图标
            type: String,
            default: '',
        },
        isItalicMode: { // 是否逆时针旋转
            type: Boolean,
            default: true,
        },
    },
    computed: {
        menus() { // 菜单数据
            return this.getCopyedArray(this.data);
        },
        innerMenuSize() { // 一级菜单长度
            return this.menus.length;
        },
        outerMenuSize() { // 当前子菜单得长度
            return this.childs.length;
        },
        needRotate: {
            set() {},
            get() {
                return this.isItalicMode && this.innerMenuSize > 2;
            },
        },
        paths() { // svg path
            return {
                dtc1: '',
                dtc2: 'M0,250 l500,0 A250,250 0 0 0 0 250.00000000000006,35.49364905389032 z',
                dtc3: 'M250,250 l250,0 A250,250 0 0,0 125.00000000000006,33.49364905389032 z',
                dtc4: 'M250,250 l250,0 A250,250 0 0,0 250.00000000000003,0 z',
                dtc5: 'M250,250 l250,0 A250,250 0 0,0 327.25424859373686,12.235870926211618 z',
                dtc6: 'M250,250 l250,0 A250,250 0 0,0 375,33.49364905389035 z',
                dtc7: 'M250,250 l250,0 A250,250 0 0,0 405.8724504646834,54.542129382992556 z',
                dtc8: 'M250,250 l250,0 A250,250 0 0,0 426.7766952966369,73.22330470336314 z',
                dtc9: 'M250,250 l250,0 A250,250 0 0,0 441.5111107797445,89.3030975783652 z',
                dtc10: 'M250,250 l250,0 A250,250 0 0,0 452.25424859373686,103.05368692688171 z',
                outer: 'M415,250 l85,0 A250,250 0 0,0 452.25424859373686,103.05368692688171 l-68.76644452187054,49.96174644486024 A165,165 0 0,1 415,250',
            };
        },
        singleWidth() { // 一级菜单为1个的情况处理
            return this.innerWidth + 10;
        },
        innerPath() { // 一级菜单svg path
            return this.paths[`dtc${this.innerMenuSize || 1}`];
        },
        rotateBase() { // 一级菜单旋转角度基数
            return 360 / this.innerMenuSize;
        },
        labelPoint() { // 一级菜单文字坐标值
            const size = this.innerMenuSize || 1;
            const point = size > 8 ? [[0, 0]] : this.needRotate ?
                InnerRotatePoints[`m${size}`].label : InnerPoints[`m${size}`].label;
            return point;
        },
        iconPoint() { // 一级菜单图标坐标值
            const size = this.innerMenuSize || 1;
            const point = size > 8 ? [[0, 0]] : this.needRotate ?
                InnerRotatePoints[`m${size}`].icon : InnerPoints[`m${size}`].icon;
            return point;
        },
        isRotate() { // 是否逆时针旋转
            return this.needRotate ? `rotate(${this.rotateBase / 2})` : '';
        },
        objectX() { // 中心点图标x
            const x = [0, 0, -123, -32, 23, 61, 85, 105];
            return this.needRotate ? x[this.innerMenuSize - 1] : 218;
        },
        objectY() { // 中心点图标x
            const y = [0, 0, 310, 318, 316, 307, 299, 296];
            return this.needRotate ? y[this.innerMenuSize - 1] : 218;
        },
        objectRotate() { // 中心点图标旋转角度
            return this.needRotate ? `rotate(${-this.rotateBase / 2})` : '';
        },
    },
    filters: {
        /**
         * 获取菜单项图标地址
         * @param {string} iconName
         */
        getIcons(iconName) {
            return `/static/images/rightMenuIcons/${iconName}.png`;
        },
        /**
         * 获取菜单项坐标位置
         * @param {Array} array 菜单坐标位置集合
         * @param {number} index 菜单项index
         * @param {string} type  横坐标还是纵坐标
         */
        getPosition(array, index, type) {
            const point = array[index];
            const key = type === 'cx' ? 0 : 1;
            return point && key <= point.length ? point[key] : 0;
        },
        /**
         * 获取菜单图标&文字旋转角度
         */
        getTransform(index, rotateBase, needRotate, menuLen, childLen, innerMenuIndex, isItalicMode) {
            let result = 0;
            if (!childLen) {
                result = needRotate ? rotateBase * 2 - rotateBase / 2 - rotateBase * (index + 1) : -rotateBase * (index - 1);
                result = `rotate(${result} 407.05950927734375 184.94381713867188)`;
            } else {
                result = 36 * menuLen + rotateBase - rotateBase * innerMenuIndex;
                result = result - 36 * (10 - childLen) / 2;
                result = result - 36 * index;
                if (menuLen === 1 || menuLen === 2) {
                    result -= menuLen === 2 ? 198 : 0;
                    result -= menuLen === 1 ? 72 : 0;
                } else {
                    result -= (menuLen - 4) * 36;
                }
                if (!isItalicMode && menuLen > 2) {
                    switch (menuLen) {
                    case 3:
                        result += 60;
                        break;
                    case 4:
                        result += 46;
                        break;
                    case 5:
                        result += 36;
                        break;
                    case 6:
                        result += 30;
                        break;
                    case 7:
                        result += 25;
                        break;
                    case 8:
                        result += 22;
                        break;
                    default:
                        break;
                    }
                }
                result = `rotate(${result} 451 184)`;
            }
            return result;
        },
    },
    methods: {
        /**
         * 菜单点击事件
         * @param {object} node 菜单项
         * @param {object} event 鼠标点击事件对象
         */
        menuClick(node, index, event) {
            event.stopPropagation();
            event.preventDefault();
            if (node.children) {
                this.$emit('menu-open', node, event);
                this.openOuterMenus(node, index);
            } else {
                this.showOuterMenus = false;
                this.toggleActiveStatus();
                this.$emit('menu-click', node, event);
            }
        },
        /**
         * 显示二级菜单
         * @param {object} node
         * @param {number} index
         * @param {boolean} isShowOuterMenus
         */
        openOuterMenus(node, index, isShowOuterMenus) {
            this.showOuterMenus = isShowOuterMenus || (this.currentInnerMenuId === node.id ? !this.showOuterMenus : true);
            this.currentInnerMenuIndex = index;
            this.currentInnerMenuId = node.id;
            this.toggleActiveStatus(node);
            this.initTransform(node.children);
        },
        /**
         * 设置二级菜单初始位置
         * @param {Array} childs 二级菜单
         */
        initTransform(childs) {
            let item = null;
            let rotate = 0;
            const self = this;
            const childRotate = 36;
            for (let i = 0, len = childs.length; i < len; i++) {
                item = childs[i];
                item.rotate = 0;
                rotate = -(self.rotateBase / 2 - (childRotate / 2) + self.rotateBase) + self.rotateBase * self.currentInnerMenuIndex;
                rotate -= childRotate * childs.length / 2 - childRotate / 2;
                item.rotate = rotate;
            }
            self.childs = self.getCopyedArray(childs);
            setTimeout(() => {
                self.createAnimate();
            }, 30);
        },
        /**
         * 添加二级菜单动画
         */
        createAnimate() {
            let item = null;
            const childRotate = 36;
            for (let i = 0, len = this.childs.length; i < len; i++) {
                item = this.childs[i];
                item.rotate = item.rotate + childRotate * i;
            }
            this.childs = this.getCopyedArray(this.childs);
        },
        /**
         * 循环菜单
         * @param {function} doSomthing 每次循环菜单执行的操作
         */
        iteratorMenus(doSomthing) {
            for (let i = 0, len = this.menus.length; i < len; i++) {
                if (doSomthing) doSomthing(this.menus[i], i);
            }
        },
        /**
         * 设置菜单高亮状态
         * @param {object} node  点击得菜单节点数据
         * @param {object} event 鼠标点击事件对象
         */
        toggleActiveStatus(node) {
            this.iteratorMenus((item) => {
                const itemData = item;
                itemData.active = false;
            });
            if (this.showOuterMenus && node) {
                node.active = true;
            }
        },
        /**
         * 显示实体菜单，外部右击时调用
         * @param {number} x      mouse -> pageX
         * @param {number} y      mouse -> pageY
         * @param {number, string} autoOpenMenuId 自动打开的节点id
         */
        showMenu(x, y, autoOpenMenuId) {
            const self = this;
            const menuw = 240;
            const warpw = 380;
            const wh = window.innerHeight;
            const ww = window.innerWidth;
            let left = (x - menuw / 2) - (warpw - menuw) / 2;
            let top = (y - menuw / 2) - (warpw - menuw) / 2;
            left = left < 85 ? 85 : left;
            top = top < 50 ? 50 : top;
            top = (top + warpw) > wh ? wh - warpw : top;
            left = (left + warpw) > ww ? ww - warpw - (warpw - menuw) / 2 : left;

            setTimeout(() => {
                self.showMenus = true;
            }, 100);

            if (autoOpenMenuId) { // 自动打开的节点id
                self.iteratorMenus((item, index) => {
                    const itemData = item;
                    itemData.active = false;
                    if (item.id === autoOpenMenuId) {
                        itemData.active = true;
                        setTimeout(() => {
                            self.openOuterMenus(itemData, index, true);
                        }, 200);
                    }
                });
            }

            self.positonStyle = {
                left: `${left}px`,
                top: `${top}px`,
            };
        },
        /**
         * 隐藏实体菜单
         */
        hideMenu() {
            this.childs = [];
            this.showOuterMenus = false;
            this.showMenus = false;
            this.toggleActiveStatus();
        },
        /**
         * 空白处点击事件
         * @param {object} e 鼠标点击事件对象
         */
        whiteSpaceClick(e) {
            const target = e.target;
            if (target && target.nodeName) {
                const nodeName = target.nodeName.toLowerCase();
                if (nodeName === 'canvas' ||
                    (nodeName !== 'canvas' && nodeName !== 'circle' && nodeName !== 'svg' && nodeName !== 'image') ||
                    (nodeName === 'svg' && target.className.baseVal.indexOf('mc-outer') > -1)) {
                    this.hideMenu();
                }
            }
        },

        getCopyedArray(arr = []) {
            return JSON.parse(JSON.stringify(arr));
        }
    },
    mounted() {
        document.body.addEventListener('click', this.whiteSpaceClick, false);
    },
    destoryed() {
        document.body.removeEventListener('click', this.whiteSpaceClick, false);
    },
};

</script>

<style lang="scss">
@import './menus.scss';

</style>
