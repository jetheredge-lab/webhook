const axios = require('axios');
async function test() {
    const payloads = [
        { name: "APEX_510310", password: "A#341U7GU0Cp", appId: "", appVersion: "", cid: 0, sec: "" },
        { name: "APEX_510310", password: "A#341U7GU0Cp", appId: "SampleApp", appVersion: "1.0", cid: 0, sec: "change_me" },
        { name: "APEX_510310", password: "A#341U7GU0Cp", appId: "", appVersion: "", cid: 8, sec: "", deviceId: "00000000-0000-0000-0000-000000000000" },
        { name: "APEX_510310", password: "A#341U7GU0Cp", appId: "TraderApp", appVersion: "1.0", cid: 0, sec: "" }
    ];
    let count = 1;
    for (let p of payloads) {
        console.log(`\n--- Test ${count++} ---`);
        try {
            const auth = await axios.post('https://demo.tradovateapi.com/v1/auth/accesstokenrequest', p);
            console.log('Login successful');
            const token = auth.data.accessToken;
            try {
                const positions = await axios.get('https://demo.tradovateapi.com/v1/position/list', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log('GET positions: SUCCESS', positions.data.length, 'positions');
            } catch (err) {
                console.log('GET positions: FAILED', err.response?.status, err.response?.data);
            }
        } catch (authErr) {
            console.log('Login failed', authErr.response?.status);
        }
    }
}
test();
