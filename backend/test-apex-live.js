const axios = require('axios');
async function test() {
    console.log('--- TESTING LIVE SERVER ---');
    try {
        const auth = await axios.post('https://live.tradovateapi.com/v1/auth/accesstokenrequest', {
            name: "APEX_510310",
            password: "A#341U7GU0Cp",
            appId: "SampleApp",
            appVersion: "1.0",
            cid: 0,
            sec: "change_me"
        });
        console.log('Login successful');
        const token = auth.data.accessToken;
        const sync = await axios.post('https://live.tradovateapi.com/v1/user/syncrequest', {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('ACCOUNTS FOUND on LIVE:', sync.data.accounts?.map(a => ({ id: a.id, name: a.name })));
    } catch (authErr) {
        console.log('Login failed on LIVE', authErr.response?.status, authErr.response?.data);
    }
}
test();
