const Init = require('./utils/init');
const routes = require('./routes');
const apis = require('./apis');

const init = new Init({
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

Init.start(init, true);

App({
    onLaunch: function() {},
    globalData: {}
})