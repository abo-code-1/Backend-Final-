/* eslint-disable no-console */
import bcrypt from "bcryptjs";
import prismaPkg from "@prisma/client";

const { PrismaClient } = prismaPkg;

const prisma = new PrismaClient();

const cities = ["almaty", "astana", "shymkent"];

const makeListing = (hostId, index) => ({
  hostId,
  title: `Комната для соседа #${index + 1}`,
  description:
    "Светлая квартира, дружелюбные соседи, удобная локация и понятные правила проживания.",
  city: cities[index % cities.length],
  district: index % 2 === 0 ? "bostandyk" : "yesil",
  address: `Улица ${index + 10}, дом ${index + 1}`,
  monthlyRent: 120000 + index * 15000,
  deposit: 50000 + index * 5000,
  totalRooms: 3 + (index % 2),
  availableRooms: 1 + (index % 2),
  currentOccupants: 1 + (index % 2),
  maxOccupants: 3 + (index % 2),
  petsAllowed: index % 2 === 0,
  smokingAllowed: index % 3 === 0 ? "outside" : "no",
  genderPreference: index % 3 === 0 ? "any" : index % 2 === 0 ? "female" : "male",
  minAge: 20,
  maxAge: 35,
  furnished: true,
  internetIncluded: true,
  minStayMonths: 3,
  photos: [
    `https://images.unsplash.com/photo-1484154218962-a197022b5858?sig=${index + 1}`,
    `https://images.unsplash.com/photo-1493666438817-866a91353ca9?sig=${index + 1}`
  ],
  status: "active",
  isApproved: index % 4 !== 0
});

async function main() {
  const passwordHash = await bcrypt.hash("Roomie123!", 10);

  await prisma.review.deleteMany();
  await prisma.application.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.houseRule.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.idVerification.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.lifestyleProfile.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      email: "admin@roomie.kz",
      passwordHash,
      fullName: "Roomie Admin",
      phone: "+77010000000",
      role: "admin",
      isPhoneVerified: true,
      isIdVerified: true
    }
  });

  const hosts = await Promise.all(
    Array.from({ length: 3 }).map((_, index) =>
      prisma.user.create({
        data: {
          email: `host${index + 1}@roomie.kz`,
          passwordHash,
          fullName: `Host ${index + 1}`,
          phone: `+7701000000${index + 1}`,
          role: "host",
          bio: "Ищу аккуратного и уважительного соседа.",
          occupation: "Product Manager",
          isPhoneVerified: true,
          isIdVerified: index !== 2
        }
      })
    )
  );

  const seekers = await Promise.all(
    Array.from({ length: 5 }).map((_, index) =>
      prisma.user.create({
        data: {
          email: `seeker${index + 1}@roomie.kz`,
          passwordHash,
          fullName: `Seeker ${index + 1}`,
          phone: `+7702000000${index + 1}`,
          role: "seeker",
          bio: "Ищу комнату в спокойной и дружелюбной квартире.",
          occupation: "Developer",
          isPhoneVerified: index % 2 === 0,
          isIdVerified: index % 3 === 0
        }
      })
    )
  );

  const allUsers = [admin, ...hosts, ...seekers];
  await Promise.all(
    allUsers.map((user, index) =>
      prisma.lifestyleProfile.create({
        data: {
          userId: user.id,
          sleepSchedule: index % 2 === 0 ? "early_bird" : "night_owl",
          cleanliness: 3 + (index % 3),
          smoking: index % 3 === 0 ? "outside" : "no",
          petsOk: index % 2 === 0,
          guestsFrequency: index % 3 === 0 ? "rare" : "sometimes",
          noiseTolerance: 2 + (index % 3),
          diet: index % 2 === 0 ? "halal" : "any",
          hasPets: index % 4 === 0,
          workFromHome: index % 2 === 0
        }
      })
    )
  );

  const listings = [];
  for (let i = 0; i < 8; i += 1) {
    const host = hosts[i % hosts.length];
    const listing = await prisma.listing.create({
      data: makeListing(host.id, i)
    });
    listings.push(listing);

    await prisma.bill.createMany({
      data: [
        {
          listingId: listing.id,
          category: "rent",
          label: "Базовая аренда",
          amountKzt: listing.monthlyRent,
          isIncludedInRent: true
        },
        {
          listingId: listing.id,
          category: "utilities",
          label: "Коммунальные",
          amountKzt: 18000 + i * 1000,
          isIncludedInRent: false
        },
        {
          listingId: listing.id,
          category: "internet",
          label: "Интернет",
          amountKzt: 6000,
          isIncludedInRent: i % 2 === 0
        }
      ]
    });

    await prisma.houseRule.createMany({
      data: [
        { listingId: listing.id, ruleText: "Тишина после 23:00", orderIndex: 0 },
        { listingId: listing.id, ruleText: "Уборка по графику", orderIndex: 1 },
        { listingId: listing.id, ruleText: "Без вечеринок", orderIndex: 2 }
      ]
    });
  }

  await Promise.all(
    seekers.slice(0, 4).map((seeker, index) =>
      prisma.application.create({
        data: {
          listingId: listings[index].id,
          seekerId: seeker.id,
          message: "Здравствуйте! Я аккуратный и спокойный, готов заселиться в ближайший месяц.",
          status: index === 0 ? "accepted" : index === 1 ? "rejected" : "pending"
        }
      })
    )
  );

  await Promise.all(
    seekers.slice(0, 3).map((seeker, index) =>
      prisma.favorite.create({
        data: {
          userId: seeker.id,
          listingId: listings[index + 2].id
        }
      })
    )
  );

  await Promise.all(
    seekers.slice(0, 2).map((seeker, index) =>
      prisma.review.create({
        data: {
          reviewerId: seeker.id,
          revieweeId: hosts[index].id,
          rating: 4 + (index % 2),
          comment: "Позитивный опыт совместного проживания."
        }
      })
    )
  );

  await Promise.all(
    seekers.slice(0, 3).map((seeker, index) =>
      prisma.savedSearch.create({
        data: {
          userId: seeker.id,
          name: `Поиск ${index + 1}`,
          filterJson: {
            city: cities[index % cities.length],
            minPrice: 100000,
            maxPrice: 220000,
            furnished: "true"
          }
        }
      })
    )
  );

  await Promise.all(
    seekers.slice(0, 3).map((seeker, index) =>
      prisma.idVerification.create({
        data: {
          userId: seeker.id,
          imageUrl: `https://example.com/id-${seeker.id}.jpg`,
          status: index === 0 ? "approved" : "pending"
        }
      })
    )
  );

  console.log("Seed completed:");
  console.log("- 1 admin");
  console.log("- 3 hosts");
  console.log("- 5 seekers");
  console.log("- 8 listings (with bills and house rules)");
  console.log("- applications, favorites, reviews, saved searches, id verifications");
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
