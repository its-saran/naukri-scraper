import Search from "../services/searchService.js";
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
          jobExperience:req.query.experience,
        };
        
        this.controllerStatus = {
            checkQueries: null,
            checkConfig: null,
            getProxyInfo: null,
            startSearch: null,
            updateLog: null,
            sendTotalJobs: null
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
    async startSearch() {
        if (this.controllerStatus.getProxyInfo) {
            try {
                this.search = new Search(this.log.id, this.searchQuery, this.config);
                await this.search.start();
                this.log.console = {...this.log.console, ...this.search.log}
                this.logMessage(`Search Finished`);
                this.controllerStatus.startSearch = true
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
                proxyInfo: this.search.proxyInfo || 'unknown',
                totalJobs: this.search.totalJobs || 0
            };
            this.controllerStatus.updateLog = true
        } 
    }
    async sendTotalJobs() {
        if (this.controllerStatus.startSearch) {
            const totalJobs = this.search.totalJobs
            this.res.send({totalJobs});
            this.controllerStatus.sendTotalJobs = true
        }
    }
    async start() {
      this.logMessage(`Keyword: ${this.searchQuery.jobKeyword}, Location: ${this.searchQuery.jobLocation}, Experience: ${this.searchQuery.jobExperience}`);
      this.logMessage(`Running ${this.platform} search`);

      await this.checkQueries()
      try {
          await this.checkConfig()
          await this.getProxyInfo()
          await this.startSearch();
          await this.updateLog();
          await this.sendTotalJobs();
      } catch (error) {
          this.errorMessage(error.message);
          const err = utils.createError({status: 500, details: "An unexpected error occurred while processing the request. Please try again later."});
          this.res.status(err.error.status).json(err);
          console.log(this.controllerStatus)
      }
    }
}

const searchController = (req, res, config) => new Controller (req, res, config)

export default searchController;





