// import { PrismaPg } from "@prisma/adapter-pg";
// import { PrismaClient } from "@prisma/client";

// const connectionString = `${process.env.DATABASE_URL}`;

// const adapter = new PrismaPg({ connectionString });

// const prisma = (() => {
// 	if (process.env.NODE_ENV === "production") {
// 		return new PrismaClient({ adapter });
// 	} else {
// 		const globalWithPrisma = globalThis as typeof globalThis & {
// 			prisma: PrismaClient;
// 		};
// 		if (!globalWithPrisma.prisma) {
// 			globalWithPrisma.prisma = new PrismaClient({ adapter });
// 		}
// 		return globalWithPrisma.prisma;
// 	}
// })();

// export default prisma;
