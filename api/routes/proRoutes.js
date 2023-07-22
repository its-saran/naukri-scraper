import express from 'express';
import searchController from '../controllers/searchController.js';
import scrapeController from '../controllers/scrapeController.js';

const proRouter = (config) => {
    const router = express.Router();
    router.get('/search', (req, res) => searchController(req, res, config));
    router.get('/scrape', (req, res) => scrapeController(req, res, config));
    return router;
};

export default proRouter;











