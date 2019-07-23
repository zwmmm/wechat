import util, { loading, logger, message, router, storage, promise } from './utils';
import diff from './diff';

// 将会diff计算出修改的内容
function update(originData) {
    return new Promise(resolve => {
        let diffResult = diff(this.data, originData);
        this.setData(diffResult, () => {
            originData = JSON.parse(JSON.stringify(this.data || {}));
            resolve();
        });
    })
}

const _Page = Page;
const _Component = Component;

const ENVS = ['dev', 'pre', 'pro'];

function init(option) {
    const $baseURL = option.baseURL || {};
    const $apis = option.apis || {};
    const $header = option.header || {};
    const WE_ENV = option.WE_ENV || 'dev';
    const debug = option.debug || false;



    // 聚合
    const init = {
        $apis,
        WE_ENV,
        $logger: logger,
        $router: router,
        $storage: storage,
        $message: message,
        $loading: loading,
        $utils: util,
        $wx: promise,
    };

    Page = options => {
        let originData = JSON.parse(JSON.stringify(options.data || {}));
        const onLoad = options.onLoad || function() {};
        options.onLoad = function(data) {
            init.$routes = data;
            this.$update = update.bind(this, originData);
            return onLoad.apply(this);
        }
        return _Page(Object.assign({}, options, init))
    };

    Component = options => {
        let originData = JSON.parse(JSON.stringify(options.data || {}));
        const originAttached = options.attached || function() {};
        options.attached = function(e) {
            Object.assign(this, init);
            this.$update = update.bind(this, originData);
            return originAttached.apply(this);
        }
        return _Component(options);
    };

    if (!debug) return;
}

export default init;
