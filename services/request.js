import { logger, storage } from '../utils/utils'

const fetch = (url, method = 'GET', data = {}, header = {}) => {

    return new Promise((resolve, reject) => {
        wx.request({
            url,
            data,
            header: {
                token: storage.get('token', true),
                ...header
            },
            method,
            dataType: 'json',
            success(res) {
                logger.log(`${url}请求成功：params=${JSON.stringify(data)} body=${JSON.stringify(res || {})}`)
                if (res.data.code === 0) {
                    resolve(res.data);
                } else {
                    const err = new Error(res.data.msg)
                    err.code = res.code
                    reject(err);
                }
            },
            fail(err) {
                logger.error(`${url}请求失败`, err);
                reject(err);
            }
        })
    })
};

export default fetch
