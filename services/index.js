import request from './request'
import { apiPrefix } from '../utils/config'
import pathToRegexp from './path-to-regxp'

import api from './apis'

const baseApi = apiPrefix.dev

const gen = params => {
    let url = baseApi + params
    let method = 'GET'

    const paramsArray = params.split(' ')
    if (paramsArray.length === 2) {
        method = paramsArray[0]
        url = baseApi + paramsArray[1]
    }

    return function(data) {
        const match = pathToRegexp.parse(url)
        url = pathToRegexp.compile(url)(data)

        for (const item of match) {
            if (item instanceof Object && item.name in data) {
                delete data[item.name]
            }
        }

        return request(url, method, data)
    }
}

const APIFunction = {}

for (const key in api) {
    APIFunction[key] = gen(api[key])
}

export default APIFunction
