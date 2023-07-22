import utils from '../utils/helper.js'
import { firestoreDb } from '../utils/firebase.js';

const incomingLogger = (config) => async (req, res, next) => {
    const serviceName = config.serviceName
    if (req.body) {
        req.log = await firestoreDb.getDoc(req.body.path, req.body.id)
        req.log.service.url = req.originalUrl
        req.log.service.time = utils.time() 
        const requestLog = `Request | ${req.log.id} | URL: ${req.originalUrl}`
        utils.reqResMessage(serviceName, requestLog, req.log.console)
    }
    next();
};
  
export default incomingLogger;












