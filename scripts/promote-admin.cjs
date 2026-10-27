const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const email = process.argv[2];
  if (!email)
    throw new Error("Usage: npm run admin:promote -- operator@example.com");
  const account = await prisma.account.update({
    where: { email: email.toLowerCase() },
    data: { superAdmin: true },
  });
  console.log(`Platform access granted to ${account.email}.`);
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
