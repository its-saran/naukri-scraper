import Scrape from "../services/scrapeService.js";
import { firestoreDb } from '../utils/firebase.js';
import utils from '../utils/helper.js';

class Controller {
    constructor(req, res, config) {
        this.req = req
        this.res = res
        this.log = req.log
        this.config = config
        this.platform = this.config.serviceName

        this.searchQuery = {
            jobKeyword: req.query.keyword, 
            jobLocation: req.query.location, 
            jobExperience: req.query.experience,
            maxJobs: req.query.maxjobs, 
            sortBy: req.query.sortby,
            startPage: req.query.startpage
        }

        if (req.log.gatewayReq.apiRoute == 'demo') {
            this.searchQuery.maxJobs = this.config.maxJobsDemo
        } 
        

        this.controllerStatus = {
            checkQueries: null,
            checkConfig: null,
            getProxyInfo: null,
            startScrape: null,
            updateLog: null,
            sendJobs: null,
            addToDatabase: null
        }
        this.logMessage = (message) => utils.logMessage(this.config.serviceName, this.log.id, message, this.log.console);
        this.errorMessage = (message) => utils.errorMessage(this.config.serviceName, this.log.id, message, this.log.console);

        this.start();
    }
    async checkQueries() {
        if(this.searchQuery.jobKeyword || this.searchQuery.jobLocation) {
            this.controllerStatus.checkQueries = true
        } else {
            this.errorMessage(`Error: Insufficient parameters`);
            const err = utils.createError({status: 400, details: "Atleast one of the parameters is required: 'location', 'keyword'."});
            this.res.status(err.error.status).json(err);
        }
    }
    async checkConfig() {
        if(this.controllerStatus.checkQueries) {
            if (this.config) {
                this.controllerStatus.checkConfig = true
            }
        } else {
            this.errorMessage(`Error: Configuration not found`);
        }
    }
    async getProxyInfo() {
        if (this.controllerStatus.checkConfig) {
            if (this.config.proxyStatus) {
              this.config.proxy = await firestoreDb.getDoc('Proxies', 'Asocks-89.38.99.29:15915');
            }
            this.controllerStatus.getProxyInfo = true
        } else {
            this.errorMessage(`Error: Unable to get proxy info`);
        }
    }
    async startScrape() {
        if (this.controllerStatus.getProxyInfo) {
            try {
                this.scrape = new Scrape(this.log.startTime, this.log.id, this.searchQuery, this.config);
                await this.scrape.start();
                this.log.console = {...this.log.console, ...this.scrape.log}
                this.logMessage(`Scraping Finished`);
                this.controllerStatus.startScrape = true
            } catch (error) {
                throw error;
            }
        }
    }
    async updateLog() {
        if (this.controllerStatus.checkQueries) {
            this.searchQuery = Object.fromEntries(
                Object.entries(this.searchQuery).map(([key, value]) => [key, value !== undefined ? value : 'undefined'])
            );
            this.log.service = {
              searchQuery: this.searchQuery || 'Not given',
              proxyInfo: this.scrape.proxyInfo || 'unknown',
              totalJobs: this.scrape.totalJobs || 0
            };
            this.controllerStatus.updateLog = true
        } 
    }
    async sendJobs() {
        if (this.controllerStatus.startScrape) {
            const jobs = this.scrape.jobs
            this.res.send(jobs);
            this.controllerStatus.sendJobs = true
        }
    }
    async addToDatabase() {
        if (this.controllerStatus.startScrape) {
            let jobs = this.scrape.jobs;
            if (jobs.length != 0) {
                jobs = utils.addId(jobs, 'logId', this.log.id); //Add logId on each jobs
                jobs = utils.addUniqueId(jobs, this.config.uniqueIdName, this.config.uniqueIdPrefix); //Add Unique Id on each jobs
                jobs = utils.addObjectInArray(jobs, 'searchQuery', this.searchQuery); //Add seacrh query on each jobs
                await firestoreDb.batchCreateDoc(`Data/${this.platform}/Jobs`, this.config.uniqueIdName, jobs);
                this.controllerStatus.addToDatabase = true
            }
        }
    }
    async start() {
        this.logMessage(`Keyword: ${this.searchQuery.jobKeyword}, Location: ${this.searchQuery.jobLocation}, Max jobs: ${this.searchQuery.maxJobs}`);
        this.logMessage(`Running ${this.platform} Scraper`);

        await this.checkQueries()
        try {
            await this.checkConfig()
            await this.getProxyInfo()
            await this.startScrape();
            await this.updateLog();
            await this.sendJobs();
            await this.addToDatabase();
        } catch (error) {
            console.log(error)
            this.errorMessage(`Error: ${error.message}`);
            const err = utils.createError({status: 500, details: "An unexpected error occurred while processing the request. Please try again later."});
            this.res.status(err.error.status).json(err);
            console.log(this.controllerStatus)
        }
    }
}

const scrapeController =  (req, res, config) => new Controller (req, res, config)

export default scrapeController;