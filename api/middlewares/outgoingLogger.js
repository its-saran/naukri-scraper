import utils from '../utils/helper.js';
import { firestoreDb } from '../utils/firebase.js';

const outgoingLogger = (config) => async (req, res, next) => {
    const serviceName = config.serviceName;
    let log = req.log
    const errorMessage = (message) => utils.errorMessage(log.id, message, log.console);

    res.on('finish', async () => {
        log.service.memoryUsage = (process.memoryUsage().rss / (1024 * 1024)).toFixed(2); // Get memory usage in megabytes with 2 decimal places

        const responseLog = `Response | ${req.log.id} | URL: ${req.originalUrl}`;
        utils.reqResMessage(serviceName, responseLog, req.log.console);

        try {
            await firestoreDb.createDoc(log.path, log.id, log)
        } 
        catch (error) {
            errorMessage(`Error creating log`)
        }
    });

    next();
};

export default outgoingLogger;
