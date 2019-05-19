const Init = require('./utils/init');
const routes = require('../routes');
const apis = require('../apis');

new Init({
    routes,
    apis,
    baseURL: {
        dev: '',
        pre: '',
        pro: '',
    },
    header: {},
    debug: true,
});

Init.start();

App({
    onLaunch: function() {},
    globalData: {}
})