const _Page = Page;
const _Component = Component;

function shake() {
    const X = 1;
    const Y = 1;
    const Z = 0;
    let stsw = true;
    let positivenum = 0;

    wx.startAccelerometer(e => {
        console.log(e)
        if ((X < e.x && Y < e.y) || (Z < e.z && Y < e.y)) {
            positivenum++
            setTimeout(() => positivenum = 0, 2000);
        }

        if (positivenum === 2 && stsw) {
            stsw = false;
            wx.vibrateLong({
                success: () => {
                    wx.showActionSheet({
                        itemList: this.env,
                        success(type) {
                            init.WE_ENV = type;
                        },
                        finally() {
                            setTimeout(() => {
                                positivenum = 0;
                                stsw = true;
                            }, 2000)
                        }
                    })
                }
            })
        }
    })
}

class Init {
    constructor({
        routes,
        baseURL,
        apis,
        header,
    }) {
        this.$routes = routes || {};
        this.$baseURL = baseURL || {};
        this.$apis = apis || {};
        this.$header = header || {};
        this.WE_ENV = 'pro';

        /**
         * 日志系统
         * @type {{}}
         */
        this.$logger = {
            LogManager: wx.getLogManager(),
            log: (...arg) => {
                if (this.WE_ENV === 'pro') {
                    this.$logger.LogManager.log(...arg);
                } else {
                    this.$logger = console.log(...arg);
                }
            },
            error: (...arg) => {
                if (this.WE_ENV === 'pro') {
                    this.$logger.LogManager.warn(...arg);
                } else {
                    this.$logger = console.error(...arg);
                }
            }
        }

        // 由于对象的原型会被替换掉，所以所有扩展的内容都需要绑定在实例上

        /**
         * 生成querystring
         * @param path
         * @param query
         * @returns {*}
         */
        this.$createURL = (path, query) => {
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
        this.$promise = (fn) => {
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

        /**
         * 发送请求
         * @param name
         * @param params
         * @returns {*}
         */
        this.$fetch = (name, params = {}) => {
            const path = this.$apis[name];
            if (path) {
                this.$logger.log(`${path}未配置API`);
                return;
            }

            return new Promise((resolve, reject) => {
                const data = params.data || {};
                wx.request({
                    url: this.$baseURL[this.WE_ENV] + path,
                    data,
                    header: {
                        ...this.$header,
                        ...(params.header || {}),
                    },
                    method: params.method || 'GET',
                    dataType: 'json',
                    success(res) {
                        this.$logger.log(`${path}请求成功：params=${JSON.stringify(data)} body=${JSON.stringify(res || {})}`)
                        resolve(res);
                    },
                    fail(err) {
                        this.$logger.error(`${path}请求失败`, err);
                        reject(err);
                    }
                })
            })
        }
    }

    static env = ['dev', 'pre', 'pro']

    static start(init, debug) {
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

        // 开启摇晃手机切换环境变量
        shake();
    }

    /**
     * 路由对象
     * @type {{to(*, *=, *=): (undefined|*), push(*=, *=, *=): *, redirect(*=, *=): *, reLaunch(*=, *=): *, go(*=): *}}
     */
    $router = {
        to: (name, query, type) => {
            const path = this.$routes[name];
            if (path) {
                console.log(`${path}未配置路由`)
                return;
            }
            ;
            return this.$promise(type)({ url: this.$createURL(path, query) });
        },

        /**
         * 路由跳转，需要实现声明路由表
         * @param name 路由名称
         * @param query 路由携带的参数 当为 true 或者 false 的时候表示 isTabbar
         * @param isTabbar 是否为tab跳转 默认为 false
         */
        push: (name, query = {}, isTabbar = false) => {
            let type = isTabbar ? 'navigateTo' : 'switchTab';
            if (query === true) {
                type = 'switchTab';
                query = {};
            }
            ;
            return this.$router.to(name, query, type);
        },
        /**
         * 路由重定向
         * @param name
         * @param query
         * @returns {*}
         */
        redirect: (name, query = {}) => {
            return this.$router.to(name, query, 'redirectTo');
        },
        /**
         * 关闭所有页面然后跳转页面
         * @param name
         * @param query
         * @returns {*}
         */
        reLaunch: (name, query = {}) => {
            return this.$router.to(name, query, 'reLaunch');
        },
        /**
         * 后退
         * @param delta
         * @returns {*}
         */
        go: (delta = 1) => {
            return this.$promise(wx.navigateBack)({ delta });
        },
    }

    /**
     * 本地数据管理
     * @type {{get(*=, *=): *, set(*=, *=, *=): *, clear(*=): *, info(*=): *}}
     */
    $storage = {
        get: (key, isSync = false) => {
            if (isSync) {
                return wx.getStorageSync(key);
            }
            return this.$promise('getStorage')({ key });
        },
        set: (key, value, isSync) => {
            if (isSync) {
                return wx.setStorageSync(key, value);
            }
            return this.$promise('setStorage')({ key, data: value });
        },
        clear: (isSync) => {
            if (isSync) {
                return wx.clearStorageSync();
            }
            return this.$promise('clearStorage')();
        },
        info: (isSync) => {
            if (isSync) {
                return wx.getStorageInfoSync();
            }
            return this.$promise('getStorageInfo')();
        }
    }

    /**
     * 消息提示
     * @type {{success(*=, *=): void, error(*=): void}}
     */
    $message = {
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
    }

    /**
     * loading
     * @type {{start(*=): *, end(): *}}
     */
    $loading = {
        start: (title = '正在努力加载中...') => {
            return this.$promise('showLoading')({
                title,
                mask: true,
            })
        },
        end: () => {
            return this.$promise('hideLoading')();
        }
    }
}

module.exports = Init;
