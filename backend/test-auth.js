require('dotenv').config();
const axios = require('axios');
const pino = require('pino');
const logger = pino();
async function main() {
    try {
        await axios.post('https://live.tradovateapi.com/v1/auth/accesstokenrequest', {
            name: "test",
            password: "test",
            appId: 'SampleApp',
            appVersion: '1.0',
            cid: 0,
            sec: 'change_me'
        });
    } catch(err) {
        logger.error(err.response?.data || err, 'Credential test failed:');
    }
}
main();
