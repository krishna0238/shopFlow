import { prisma } from "../../lib/prisma";

async function main() {
  const business = await prisma.business.create({
    data: {
      name: "ShopFlow Demo Shop",
    },
  });

  console.log("Created business:");
  console.log(business);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
