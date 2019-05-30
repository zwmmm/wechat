export default {
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
     * 回调函数转换成promise的形式
     * @param {*} fn: wx的异步api
     */
    promise(fn) {
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
}
