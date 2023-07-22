import express from 'express';

import getConfig from './api/utils/getConfig.js';
import proRoutes from './api/routes/proRoutes.js';
import demoRouter from './api/routes/demoRoutes.js';

import errorHandler from './api/middlewares/errorHandler.js'
import incomingLogger from './api/middlewares/incomingLogger.js';
import outgoingLogger from './api/middlewares/outgoingLogger.js';

const startServer = async () => {
    const config = await getConfig();
    const jsonParser = express.json({ limit: '50mb' });
    const incomingLog = incomingLogger(config); 
    const outgoingLog = outgoingLogger(config);
    const apiRoutes = proRoutes(config);
    const demoRoutes = demoRouter(config);

    const app = express();
    app.use(jsonParser);
    app.use(incomingLog); // Logging middleware for incoming requests
    app.use(outgoingLog); // Logging middleware for outgoing requests
    app.use('/api', apiRoutes); // api routes
    app.use('/demo', demoRoutes); //demo routes
    app.use(errorHandler); // Error Handler middleware

    const PORT = 5000;

    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
};

startServer();















  // console.log(`Server running on http://localhost:${PORT}/api/scrape?keyword=python&location=kochi&maxjobs=200`);







