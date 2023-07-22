import createError from 'http-errors';
import moment from 'moment-timezone';
import { v4 as uuidv4 } from 'uuid';

const utils = {
    waitFor: delay => new Promise(resolve => setTimeout(resolve, delay)),
    shuffle: (array) => {
        for(let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },
    createError: ({status, message, details}) => {
        if (status && message && details)  {
            return { error: { status, message, details }}
        } else if (status && message && !details ) {
            return { error: { status, message }}
        } else if(status && !message && details) {
            const err = createError(status)
            return { error: { status: err.status, message: err.message, details }}
        } else if (status && !message && !details ) {
            const err = createError(status)
            return { error: { status: err.status, message: err.message }}
        }
    },
    time: () => moment().tz('Asia/Kolkata').format('DD-MM-YYYY h:mm:ss A'),
    timeMilli: () => moment().tz('Asia/Kolkata').format('DD-MM-YYYY h:mm:ss.SSS A'),
    timeId: () => moment().tz('Asia/Kolkata').format('YYYYMMDD-hhmmssSSS'),
    timeStamp: () => moment().tz('Asia/Kolkata').toISOString(),
    moment: () => moment(),
    elapseTime : (startTime, endTime) => moment.duration(endTime.diff(startTime)).asSeconds(),
    logMessage : (serviceName, id, message, consoleObject) => {
        console.log(`${serviceName} | ${utils.time()} | ${id} | ${message}`)
        consoleObject[utils.timeMilli()] = `${serviceName} | ${message}`
    },
    errorMessage : (serviceName, id, message, consoleObject) => {
        console.error(`${serviceName} | ${utils.time()} | ${id} | ${message}`)
        consoleObject[utils.timeMilli()] = `${serviceName} | ${message}`
    },
    reqResMessage: (serviceName, message, consoleObject) => {
        console.log(`${serviceName} | ${utils.time()} | ${message}`)
        consoleObject[utils.timeMilli()] = `${serviceName} | ${message}`
    },
    addId : (array, Idkey, Idvalue) => array.map(item => ({...item, [Idkey]: `${Idvalue}`})),
    addUniqueId : (array, Idkey, IdvaluePrefix) => array.map(item => ({...item, [Idkey]: `${IdvaluePrefix}`+`${uuidv4()}`})),
    addObjectInArray : (array, key, value) => array.map(item => ({...item, [key]: value})),
    capitalizeString: (string) => string.charAt(0).toUpperCase() + string.slice(1)
}

export default utils;




