var tpl = require('../component/vue/tpl.vue');
var vm = new Vue({
    el: '#app',
    data: {
        message: 'hello',
    },
    components: {
        'tpl': tpl
    },
    mounted: function() {

    },
    methods: {

    }
});