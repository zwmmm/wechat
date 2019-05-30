const init = require('./utils/init');
const routes = require('./routes');
const apis = require('./apis');

init({
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

App({
    onLaunch: function() {},
    globalData: {}
})