import routes from '../store/routes'

const map = new Map()

const util =  {
    /**
     * 生成querystring
     * @param path
     * @param query
     * @returns {*}
     */
    joinURL(path, query) {
        if (!query) return path;
        let tempArr = [];
        for (let key in query) {
            tempArr.push(`${key}=${encodeURIComponent(query[key])}`)
        }
        return path + '?' + tempArr.join('&');
    },
    /**
     * 获取时间戳
     * @returns {number}
     */
    now() {
        return Date.now();
    },
    /**
     * 创建节流函数
     * @param func
     * @param wait
     * @param options
     * @returns {function(): *}
     */
    throttle(func, wait, options) {
        let context, args, result;
        let timeout = null;
        // 之前的时间戳
        let previous = 0;
        // 如果 options 没传则设为空对象
        if (!options) options = {};
        // 定时器回调函数
        let later = () => {
            // 如果设置了 leading，就将 previous 设为 0
            // 用于下面函数的第一个 if 判断
            previous = options.leading === false ? 0 : utils.now();
            // 置空一是为了防止内存泄漏，二是为了下面的定时器判断
            timeout = null;
            result = func.apply(context, args);
            if (!timeout) context = args = null;
        };
        return function() {
            // 获得当前时间戳
            let now = utils.now();
            // 首次进入前者肯定为 true
            // 如果需要第一次不执行函数
            // 就将上次时间戳设为当前的
            // 这样在接下来计算 remaining 的值时会大于0
            if (!previous && options.leading === false) previous = now;
            // 计算剩余时间
            let remaining = wait - (now - previous);
            context = this;
            args = arguments;
            // 如果当前调用已经大于上次调用时间 + wait
            // 或者用户手动调了时间
            // 如果设置了 trailing，只会进入这个条件
            // 如果没有设置 leading，那么第一次会进入这个条件
            // 还有一点，你可能会觉得开启了定时器那么应该不会进入这个 if 条件了
            // 其实还是会进入的，因为定时器的延时
            // 并不是准确的时间，很可能你设置了2秒
            // 但是他需要2.2秒才触发，这时候就会进入这个条件
            if (remaining <= 0 || remaining > wait) {
                // 如果存在定时器就清理掉否则会调用二次回调
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                previous = now;
                result = func.apply(context, args);
                if (!timeout) context = args = null;
            } else if (!timeout && options.trailing !== false) {
                // 判断是否设置了定时器和 trailing
                // 没有的话就开启一个定时器
                // 并且不能不能同时设置 leading 和 trailing
                timeout = setTimeout(later, remaining);
            }
            return result;
        };
    }
}

/**
 * 回调函数转换成promise的形式
 * @param {*} fn: wx的异步api
 */
export const promise = (key) => {
    if (map.has(key)) {
        return map.get(key)
    }
    const fn = option => new Promise((resolve, reject) => {
        wx[key]({
            ...option,
            success: (...arg) => resolve.apply(null, arg),
            fail: err => {
                console.error(err);
                reject(err)
            },
        })
    });
    map.set(key, fn)
    return fn
}

/**
 * 日志系统
 * @type {{}}
 */
export const logger = {
    LogManager: wx.getLogManager(),
    log(...arg) {
        this.LogManager.log(...arg);
    },
    error(...arg) {
        this.LogManager.warn(...arg);
    }
};

/**
 * 路由对象
 * @type {{to(*, *=, *=): (undefined|*), push(*=, *=, *=): *, redirect(*=, *=): *, reLaunch(*=, *=): *, go(*=): *}}
 */
export const router = {
    to: (name, query, type) => {
        const path = routes[name];
        if (!path) {
            console.log(`${path}未配置路由`)
            return;
        }
        return promise(type)({ url: type === 'switchTab' ? path : util.joinURL(path, query) });
    },

    /**
     * 路由跳转，需要实现声明路由表
     * @param name 路由名称
     * @param query 路由携带的参数 当为 true 或者 false 的时候表示 isTabbar
     * @param isTabbar 是否为tab跳转 默认为 false
     */
    push(name, query = {}, isTabbar = false) {
        let type = isTabbar ? 'switchTab' : 'navigateTo';
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
        return promise(wx.navigateBack)({ delta });
    },
};

/**
 * 本地数据管理
 * @type {{get(*=, *=): *, set(*=, *=, *=): *, clear(*=): *, info(*=): *}}
 */
export const storage = {
    get: (key, isSync = false) => {
        if (isSync) {
            return wx.getStorageSync(key);
        }
        return promise('getStorage')({ key });
    },
    set: (key, value, isSync) => {
        if (isSync) {
            return wx.setStorageSync(key, value);
        }
        return promise('setStorage')({ key, data: value });
    },
    clear: (isSync) => {
        if (isSync) {
            return wx.clearStorageSync();
        }
        return promise('clearStorage')();
    },
    info: (isSync) => {
        if (isSync) {
            return wx.getStorageInfoSync();
        }
        return promise('getStorageInfo')();
    }
};

/**
 * 消息提示
 * @type {{success(*=, *=): void, error(*=): void}}
 */
export const message = {
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
            icon: 'none',
            duration
        })
    },
};

/**
 * loading
 * @type {{start(*=): *, end(): *}}
 */
export const loading = {
    start: (title = '正在努力加载中...') => {
        return promise('showLoading')({
            title,
            mask: true,
        })
    },
    end: () => {
        return promise('hideLoading')();
    }
};

export default util;
