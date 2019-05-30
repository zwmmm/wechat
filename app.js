import init from './utils/init';
import routes from './store/routes';
import apis from './store/apis';

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