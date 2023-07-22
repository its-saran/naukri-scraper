import axios from 'axios'
import tunnel from 'tunnel';
import utils from '../utils/helper.js';

class Search {
    constructor(logId, searchQuery, config) {
        // Validate input parameters
        if (!logId || !searchQuery || !config) {
            throw new Error("LogId, searchQuery and config parameters are required.");
        }

        // Initialize class properties
        this.platform = config.serviceName
        this.proxyInfo = 'Not connected';
        this.totalJobs = null;
        this.log = {}

        //Check if proxy is enabled in the configuration and create a proxy
        if (config.proxyStatus) {
            this.proxy = {
                host: config.proxy.host,
                port: config.proxy.port,
                proxyAuth: `${config.proxy.username}:${config.proxy.password}`
        }}

        this.axiosConfig = {
            headers: config.headers
        };

        // Set log message
        this.logId = logId
        this.logMessage = (message) => utils.logMessage(config.serviceName, this.logId, message, this.log);
        this.errorMessage = (message) => utils.errorMessage(config.serviceName, this.logId, message, this.log);

        // Encode and assign the encoded lowercase job keyword and location from the search query
        this.jobKeyword = searchQuery.jobKeyword && encodeURIComponent(searchQuery.jobKeyword.toLowerCase());
        this.jobLocation = searchQuery.jobLocation && encodeURIComponent(searchQuery.jobLocation.toLowerCase());
        this.jobExperience = searchQuery.jobExperience
    }
    async initialize() {
        try {
            this.logMessage(`Initializing search engine`);

            // Configure axios with proxy if available
            if (this.proxy) {
                const agent = tunnel.httpsOverHttp({ proxy: this.proxy })
                this.axiosConfig = { ...this.axiosConfig, httpsAgent: agent }
            }
        } catch (error) {
            throw error
        }
    }
    async checkProxy() {
        try {
            this.logMessage(`Checking proxy..`)
            const proxyCheckUrl = 'https://nordvpn.com/wp-admin/admin-ajax.php?action=get_user_info_data';

            // Get IP information from NORD VPN - IP locator
            const proxyCheckResponse = await axios.get(proxyCheckUrl, this.axiosConfig);
            this.proxyInfo = proxyCheckResponse.data
            this.logMessage(`Proxy working properly`)
        } catch (error) {
            throw error
        }
    }
    async search() {
        try {
            this.logMessage(`Started searching on ${this.platform}`)

            const pageNo = 1
            let url = `https://www.naukri.com/jobapi/v3/search?searchType=adv&pageNo=${pageNo}`
            if (this.jobLocation && this.jobKeyword) {
                url = url + `&urlType=search_by_key_loc&keyword=${this.jobKeyword}&location=${this.jobLocation}`
            } else if (this.jobLocation && !this.jobKeyword) {
                url = url + `&urlType=search_by_location&searchType=adv&location=${this.jobLocation}`
            } else if (!this.jobLocation && this.jobKeyword) {
                url = url + `&urlType=search_by_keyword&keyword=${this.jobKeyword}`
            }
            this.jobExperience !== undefined && (url += `&experience=${this.jobExperience}`);
            this.logMessage(url)

            // Send a request to the Naukri job search URL
            const response = await axios.get(url, this.axiosConfig);
            const data = response.data
            this.totalJobs = data.noOfJobs

            this.logMessage(`Total jobs: ${this.totalJobs}`, );

        } catch (error) {
            throw error
        }
    }
    async start() {
        try {
            this.logMessage(`Starting search`);
            
            // Initialize the search engine
            await this.initialize();

            // Check proxy connection if enabled
            if (this.proxy) {
                await this.checkProxy();
            }

            // Perform the search
            await this.search();
        } catch (error) {
            throw error
        }
    }
}

export default Search;




