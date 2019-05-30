const _Page = Page;
const _Component = Component;

const ENVS = ['dev', 'pre', 'pro'];

/**
 * 生成querystring
 * @param path
 * @param query
 * @returns {*}
 */
const $createURL = (path, query) => {
    if (!query) return path;
    let tempArr = [];
    for (let key in query) {
        tempArr.push(`${key}=${encodeURIComponent(query[key])}`)
    }
    return path + '?' + tempArr.join('&');
}

/**
 * 回调函数转换成promise的形式
 * @param {*} fn: wx的异步api
 */
const $promise = (fn) => {
    return option => new Promise((resolve, reject) => {
        fn.call(wx, {
            ...option,
            success: (...arg) => resolve.apply(null, arg),
            fail: err => {
                console.error(err);
                reject(err)
            },
        });
    });
}

function init(option) {
    const $routes = option.routes || {};
    const $baseURL = option.baseURL || {};
    const $apis = option.apis || {};
    const $header = option.header || {};
    const WE_ENV = option.WE_ENV || 'pro';
    const debug = option.debug || false;

    /**
     * 日志系统
     * @type {{}}
     */
    const $logger = {
        LogManager: wx.getLogManager(),
        log(...arg) {
            if (WE_ENV === 'pro') {
                this.LogManager.log(...arg);
            } else {
                console.log(...arg);
            }
        },
        error(...arg) {
            if (WE_ENV === 'pro') {
                this.LogManager.warn(...arg);
            } else {
                console.error(...arg);
            }
        }
    };

    /**
     * 发送请求
     * @param name
     * @param params
     * @returns {*}
     */
    const $fetch = (name, params = {}) => {
        const path = $apis[name];

        if (path) {
            $logger.log(`${path}未配置API`);
            return;
        }

        return new Promise((resolve, reject) => {
            const data = params.data || {};
            wx.request({
                url: $baseURL[WE_ENV] + path,
                data,
                header: {
                    ...$header,
                    ...(params.header || {}),
                },
                method: params.method || 'GET',
                dataType: 'json',
                success(res) {
                    $logger.log(`${path}请求成功：params=${JSON.stringify(data)} body=${JSON.stringify(res || {})}`)
                    resolve(res);
                },
                fail(err) {
                    $logger.error(`${path}请求失败`, err);
                    reject(err);
                }
            })
        })
    };

    /**
     * 路由对象
     * @type {{to(*, *=, *=): (undefined|*), push(*=, *=, *=): *, redirect(*=, *=): *, reLaunch(*=, *=): *, go(*=): *}}
     */
    const $router = {
        to: (name, query, type) => {
            const path = $routes[name];
            if (path) {
                console.log(`${path}未配置路由`)
                return;
            }
            ;
            return $promise(type)({ url: $createURL(path, query) });
        },

        /**
         * 路由跳转，需要实现声明路由表
         * @param name 路由名称
         * @param query 路由携带的参数 当为 true 或者 false 的时候表示 isTabbar
         * @param isTabbar 是否为tab跳转 默认为 false
         */
        push(name, query = {}, isTabbar = false) {
            let type = isTabbar ? 'navigateTo' : 'switchTab';
            if (query === true) {
                type = 'switchTab';
                query = {};
            }
            ;
            return this.to(name, query, type);
        },
        /**
         * 路由重定向
         * @param name
         * @param query
         * @returns {*}
         */
        redirect(name, query = {}) {
            return this.to(name, query, 'redirectTo');
        },
        /**
         * 关闭所有页面然后跳转页面
         * @param name
         * @param query
         * @returns {*}
         */
        reLaunch(name, query = {}) {
            return this.to(name, query, 'reLaunch');
        },
        /**
         * 后退
         * @param delta
         * @returns {*}
         */
        go: (delta = 1) => {
            return $promise(wx.navigateBack)({ delta });
        },
    };

    /**
     * 本地数据管理
     * @type {{get(*=, *=): *, set(*=, *=, *=): *, clear(*=): *, info(*=): *}}
     */
    const $storage = {
        get: (key, isSync = false) => {
            if (isSync) {
                return wx.getStorageSync(key);
            }
            return $promise('getStorage')({ key });
        },
        set: (key, value, isSync) => {
            if (isSync) {
                return wx.setStorageSync(key, value);
            }
            return $promise('setStorage')({ key, data: value });
        },
        clear: (isSync) => {
            if (isSync) {
                return wx.clearStorageSync();
            }
            return $promise('clearStorage')();
        },
        info: (isSync) => {
            if (isSync) {
                return wx.getStorageInfoSync();
            }
            return $promise('getStorageInfo')();
        }
    };

    /**
     * 消息提示
     * @type {{success(*=, *=): void, error(*=): void}}
     */
    const $message = {
        success: (msg = '成功', duration = 1500) => {
            wx.showToast({
                title: msg,
                icon: 'success',
                duration
            })
        },
        error: (msg = '失败', duration = 1500) => {
            wx.showToast({
                title: msg,
                icon: 'success',
                duration
            })
        },
    };

    /**
     * loading
     * @type {{start(*=): *, end(): *}}
     */
    const $loading = {
        start: (title = '正在努力加载中...') => {
            return $promise('showLoading')({
                title,
                mask: true,
            })
        },
        end: () => {
            return $promise('hideLoading')();
        }
    };

    // 聚合
    const init = {
        $routes,
        $apis,
        WE_ENV,
        $logger,
        $fetch,
        $router,
        $storage,
        $message,
        $loading,
    };

    Page = options => {
        return _Page(Object.assign({}, options, init))
    };
    Component = options => {
        const originAttached = options.attached || function() {
        };
        options.attached = function(e) {
            Object.assign(this, init);
            return originAttached.apply(this);
        }
        return _Component(options);
    };

    if (!debug) return;
}

module.exports = init;
