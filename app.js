import init from './utils/init';
import apis from './services/index';

init({
    apis,
    debug: true,
});

App({
    onLaunch: function() {},
    globalData: {}
})
