const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function listAccounts() {
    const accounts = await prisma.account.findMany();
    console.log("=== All Accounts ===");
    accounts.forEach((acc) => {
        console.log(`ID: ${acc.id}`);
        console.log(`Name: ${acc.name}`);
        console.log(`UserId: ${acc.userId}`);
        console.log("---");
    });
}

listAccounts()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
