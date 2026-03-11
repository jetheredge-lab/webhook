const axios = require('axios');

async function testAuth(payload) {
    try {
        const res = await axios.post('https://demo.tradovateapi.com/v1/auth/accesstokenrequest', payload);
        console.log('SUCCESS with payload:', JSON.stringify(payload));
        return res.data;
    } catch (err) {
        console.log('FAILED payload:', JSON.stringify(payload));
        console.log('Error:', err.response?.status, err.response?.data);
        return null;
    }
}

async function main() {
    const payloads = [
        { name: "APEX_510310", password: "A#341U7GU0Cp", appId: "", appVersion: "", cid: 0, sec: "" },
        { name: "APEX_510310", password: "A#341U7GU0Cp", appId: "SampleApp", appVersion: "1.0", cid: 0, sec: "change_me" },
        { name: "APEX_510310", password: "A#341U7GU0Cp", appId: "", appVersion: "", cid: 8, sec: "", deviceId: "00000000-0000-0000-0000-000000000000" }
    ];
    
    for (let p of payloads) {
        await testAuth(p);
        await new Promise(r => setTimeout(r, 1000));
    }
}
main();
