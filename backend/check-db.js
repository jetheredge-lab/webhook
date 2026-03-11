const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  try {
    const accs = await prisma.account.findMany();
    console.log('ACCOUNTS_DATA:');
    console.log(JSON.stringify(accs.map(a => ({ id: a.id, spec: a.accountSpec, tradovateId: a.tradovateAccountId, name: a.name })), null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
