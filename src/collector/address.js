const TERRA_ACCOUNT_REGEX = /^terra1[a-z0-9]{38}$/

const extractAddressFromMsg = (msg) => {
    const addrs = []

    if (!msg) {
        return addrs
    }

    const extractAddressesFromValue = (v) => {
        // v can be null and typeof null is object
        if (!v) {
            return
        }

        if (typeof v === 'string' && TERRA_ACCOUNT_REGEX.test(v)) {
            addrs.push(v)
        } else if (Array.isArray(v)) {
            v.forEach(extractAddressesFromValue)
        } else if (typeof v === 'object') {
            Object.keys(v).forEach((k) => extractAddressesFromValue(v[k]))
        }
    }

    extractAddressesFromValue(msg.value)
    return addrs
}

const extractAddressFromLog = (log) => {
    if (!log.events) {
        return []
    }

    return log.events
        .map((event) => event.attributes.filter((attr) => TERRA_ACCOUNT_REGEX.test(attr.value)).map((attr) => attr.value))
        .flat()
}

export const getAddresses = (tx) => {
    const msgs = tx.tx.value.msg
    const addrs = msgs.map(extractAddressFromMsg).flat()

    const logs = tx.logs
    if (logs) {
        addrs.push(...logs.map(extractAddressFromLog).flat())
    }

    return Array.from(new Set(addrs.filter(Boolean)))
}
