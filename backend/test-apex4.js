const axios = require('axios');
async function test() {
    try {
        const auth = await axios.post('https://demo.tradovateapi.com/v1/auth/accesstokenrequest', {
            name: "APEX_510310",
            password: "A#341U7GU0Cp",
            appId: "",
            appVersion: "",
            cid: 0,
            sec: "",
            deviceId: "913a45c7-84bc-4886-af1b-bbdb3c19b441"
        });
        const token = auth.data.accessToken;
        try {
            const sync = await axios.post('https://demo.tradovateapi.com/v1/user/syncrequest', {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Sync SUCCESS, users:', sync.data.users?.length);
            console.log('Sync SUCCESS, positions:', sync.data.positions?.length);
        } catch (err) {
            console.log('Sync FAILED', err.response?.status, err.response?.data);
        }
    } catch (authErr) {
        console.log('Login failed', authErr.response?.data);
    }
}
test();
