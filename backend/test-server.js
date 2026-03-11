const fastify = require('fastify')({ logger: false });
let out = '';
fastify.post('/api/webhook/tradingview', async (request, reply) => {
    out += 'POST /api/webhook/tradingview matched\n';
    return { ok: true };
});
fastify.post('/webhook/tradingview', async (request, reply) => {
    out += 'POST /webhook/tradingview matched\n';
    return { ok: true };
});
fastify.get('*', async (request, reply) => {
    out += 'GET ' + request.url + ' matched\n';
    return { ok: true };
});
fastify.listen({ port: 3001 }, () => {
    console.log('Server started');
});
