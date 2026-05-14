/* eslint-disable no-console */
import bcrypt from "bcryptjs";
import prismaPkg from "@prisma/client";

const { PrismaClient } = prismaPkg;
const prisma = new PrismaClient();

// Shared demo password for every seeded account.
const DEMO_PASSWORD = "Roomie123!";

// Real Unsplash interior photos — stable IDs, served directly.
const PHOTO = (id) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1000&q=80`;
const ROOM_PHOTOS = [
  "1522708323590-d24dbb6b0267",
  "1567767292278-a4f21aa2d36e",
  "1502672260266-1c1ef2d93688",
  "1505691938895-1758d7feb511",
  "1493809842364-78817add7ffb",
  "1560448204-e02f11c3d0e2",
  "1522771739844-6a9f6d5f14af",
  "1484154218962-a197022b5858",
  "1493666438817-866a91353ca9",
  "1556909114-f6e7ad7d3136",
  "1554995207-c18c203602cb",
  "1598928506311-c55ded91a20c"
].map(PHOTO);

const HOSTS = [
  {
    email: "nurlan.abenov@gmail.com",
    fullName: "Нұрлан Әбенов",
    phone: "+77017012233",
    occupation: "Инженер-строитель",
    bio: "Сдаю комнату в своей квартире. Ищу спокойного и опрятного соседа, сам работаю допоздна.",
    isIdVerified: true
  },
  {
    email: "aigerim.satbayeva@mail.ru",
    fullName: "Айгерим Сәтбаева",
    phone: "+77019945571",
    occupation: "Преподаватель английского",
    bio: "Живу одна в трёхкомнатной, сдаю две комнаты. Предпочитаю соседей-девушек, некурящих.",
    isIdVerified: true
  },
  {
    email: "daniyar.tursynov@gmail.com",
    fullName: "Данияр Тұрсынов",
    phone: "+77781120044",
    occupation: "Владелец кофейни",
    bio: "Несколько квартир под аренду в центре. Отвечаю быстро, помогаю с заселением.",
    isIdVerified: true
  },
  {
    email: "zhanna.kassymova@gmail.com",
    fullName: "Жанна Қасымова",
    phone: "+77073388190",
    occupation: "Бухгалтер",
    bio: "Сдаю комнату в новостройке. Чистота и тишина — для меня это важно.",
    isIdVerified: false
  }
];

const SEEKERS = [
  {
    email: "aruzhan.bekova@gmail.com",
    fullName: "Аружан Бекова",
    phone: "+77015567001",
    occupation: "Студентка КИМЭП",
    bio: "Ищу комнату рядом с университетом. Спокойная, не курю, по выходным уезжаю к родителям."
  },
  {
    email: "timur.aliyev@gmail.com",
    fullName: "Тимур Әлиев",
    phone: "+77019912340",
    occupation: "Frontend-разработчик",
    bio: "Работаю из дома, нужен тихий район и стабильный интернет. Аккуратный, без вредных привычек."
  },
  {
    email: "madina.zhumabayeva@mail.ru",
    fullName: "Мадина Жұмабаева",
    phone: "+77781190555",
    occupation: "Медсестра",
    bio: "Работаю посменно, ищу понимающих соседей. Люблю порядок и домашние растения."
  },
  {
    email: "alikhan.serik@gmail.com",
    fullName: "Әлихан Серік",
    phone: "+77073301288",
    occupation: "Магистрант Назарбаев Университета",
    bio: "Переехал в Астану на учёбу. Ищу комнату на длительный срок, желательно с мебелью."
  },
  {
    email: "dana.ospanova@gmail.com",
    fullName: "Дана Оспанова",
    phone: "+77017788123",
    occupation: "Графический дизайнер",
    bio: "Фрилансер, ценю уютную атмосферу. Не курю, есть кот — ищу квартиру, где можно с питомцем."
  },
  {
    email: "sanzhar.kuanysh@gmail.com",
    fullName: "Санжар Қуаныш",
    phone: "+77784456709",
    occupation: "Маркетолог",
    bio: "Активный, общительный, но уважаю личное пространство соседей. Ищу жильё ближе к центру."
  },
  {
    email: "kamila.nurlanova@mail.ru",
    fullName: "Камила Нұрланова",
    phone: "+77015590876",
    occupation: "Студентка медицинского",
    bio: "Учусь на третьем курсе, ищу комнату для девушки в спокойной квартире недалеко от учёбы."
  }
];

// hostIndex points into HOSTS; city must be a lowercase code (almaty/astana/shymkent).
const LISTINGS = [
  {
    hostIndex: 0,
    title: "Уютная комната в ЖК «Армандастар», Медеуский район",
    description:
      "Светлая комната 16 м² в трёхкомнатной квартире. Рядом парк Ботанический сад, остановка в двух минутах. В квартире живёт один человек, сосед нужен спокойный и аккуратный. Кухня и санузел в общем пользовании, вся техника есть.",
    city: "almaty",
    district: "Медеуский",
    address: "мкр. Самал-2, дом 33",
    monthlyRent: 145000,
    deposit: 145000,
    totalRooms: 3,
    availableRooms: 1,
    currentOccupants: 1,
    maxOccupants: 2,
    petsAllowed: false,
    smokingAllowed: "no",
    genderPreference: "any",
    minAge: 21,
    maxAge: 40,
    furnished: true,
    internetIncluded: true,
    minStayMonths: 6,
    photoCount: 3
  },
  {
    hostIndex: 0,
    title: "Комната рядом с метро Алмалы, для парня",
    description:
      "Сдаётся комната в двухкомнатной квартире в Алмалинском районе. До метро 5 минут пешком, рядом магазины и спортзал. Ищу соседа-парня, работающего или studента. Тихие соседи сверху, двор закрытый.",
    city: "almaty",
    district: "Алмалинский",
    address: "ул. Айтеке би, дом 145",
    monthlyRent: 110000,
    deposit: 90000,
    totalRooms: 2,
    availableRooms: 1,
    currentOccupants: 1,
    maxOccupants: 2,
    petsAllowed: false,
    smokingAllowed: "outside",
    genderPreference: "male",
    minAge: 20,
    maxAge: 35,
    furnished: true,
    internetIncluded: true,
    minStayMonths: 3,
    photoCount: 2
  },
  {
    hostIndex: 1,
    title: "Просторная комната для девушки, Бостандыкский район",
    description:
      "Комната 18 м² в чистой ухоженной квартире. Хозяйка живёт здесь же, сдаёт вторую комнату. Только для девушек, некурящих. Полностью меблировано: кровать, шкаф, рабочий стол. Рядом ТРЦ MEGA и парк.",
    city: "almaty",
    district: "Бостандыкский",
    address: "мкр. Орбита-3, дом 12",
    monthlyRent: 135000,
    deposit: 135000,
    totalRooms: 3,
    availableRooms: 1,
    currentOccupants: 1,
    maxOccupants: 2,
    petsAllowed: false,
    smokingAllowed: "no",
    genderPreference: "female",
    minAge: 19,
    maxAge: 30,
    furnished: true,
    internetIncluded: true,
    minStayMonths: 6,
    photoCount: 3
  },
  {
    hostIndex: 1,
    title: "Вторая комната в светлой квартире у парка",
    description:
      "Ещё одна комната в той же квартире — 14 м², окна во двор. Подойдёт студентке или молодому специалисту. Спокойный подъезд, консьерж, во дворе детская площадка. Заселение возможно сразу.",
    city: "almaty",
    district: "Бостандыкский",
    address: "мкр. Орбита-3, дом 12",
    monthlyRent: 120000,
    deposit: 100000,
    totalRooms: 3,
    availableRooms: 1,
    currentOccupants: 2,
    maxOccupants: 3,
    petsAllowed: false,
    smokingAllowed: "no",
    genderPreference: "female",
    minAge: 19,
    maxAge: 30,
    furnished: true,
    internetIncluded: true,
    minStayMonths: 4,
    photoCount: 2
  },
  {
    hostIndex: 2,
    title: "Комната в центре, рядом Арбат и Панфилова",
    description:
      "Историческое сердце города. Комната в большой сталинке с высокими потолками. Идеально для тех, кто любит гулять пешком — кафе, театры, парки в шаговой доступности. Сосед — дружелюбный, работает в кофейне.",
    city: "almaty",
    district: "Алмалинский",
    address: "ул. Гоголя, дом 58",
    monthlyRent: 160000,
    deposit: 160000,
    totalRooms: 2,
    availableRooms: 1,
    currentOccupants: 1,
    maxOccupants: 2,
    petsAllowed: true,
    smokingAllowed: "outside",
    genderPreference: "any",
    minAge: 22,
    maxAge: 45,
    furnished: true,
    internetIncluded: true,
    minStayMonths: 3,
    photoCount: 3
  },
  {
    hostIndex: 2,
    title: "Бюджетная комната в Ауэзовском районе",
    description:
      "Недорогой вариант для студента. Комната 12 м² в обычной квартире, без излишеств, но всё чистое и рабочее. Рядом автобусные маршруты до всех вузов города. Коммунальные делим пополам.",
    city: "almaty",
    district: "Ауэзовский",
    address: "мкр. Аксай-2, дом 70",
    monthlyRent: 85000,
    deposit: 70000,
    totalRooms: 2,
    availableRooms: 1,
    currentOccupants: 1,
    maxOccupants: 2,
    petsAllowed: false,
    smokingAllowed: "outside",
    genderPreference: "male",
    minAge: 18,
    maxAge: 28,
    furnished: false,
    internetIncluded: false,
    minStayMonths: 2,
    photoCount: 2
  },
  {
    hostIndex: 3,
    title: "Комната в новостройке, ЖК «Highvill», Есильский район",
    description:
      "Новая квартира в Астане, левый берег. Современный ремонт, тёплые полы, панорамные окна. Сдаётся одна комната — ищу соседку, которая ценит чистоту и тишину. Рядом набережная и Байтерек.",
    city: "astana",
    district: "Есильский",
    address: "ул. Сыганак, дом 25",
    monthlyRent: 130000,
    deposit: 130000,
    totalRooms: 2,
    availableRooms: 1,
    currentOccupants: 1,
    maxOccupants: 2,
    petsAllowed: false,
    smokingAllowed: "no",
    genderPreference: "female",
    minAge: 21,
    maxAge: 35,
    furnished: true,
    internetIncluded: true,
    minStayMonths: 6,
    photoCount: 3
  },
  {
    hostIndex: 3,
    title: "Тёплая комната, Сарыаркинский район, для студента",
    description:
      "Астана, правый берег. Комната в обжитой квартире недалеко от ЕНУ. Хорошее отопление, что для Астаны важно зимой. Сосед — магистрант, спокойный. Можно заехать с началом учебного года.",
    city: "astana",
    district: "Сарыаркинский",
    address: "ул. Жұмабаева, дом 19",
    monthlyRent: 95000,
    deposit: 80000,
    totalRooms: 2,
    availableRooms: 1,
    currentOccupants: 1,
    maxOccupants: 2,
    petsAllowed: false,
    smokingAllowed: "outside",
    genderPreference: "male",
    minAge: 18,
    maxAge: 30,
    furnished: true,
    internetIncluded: true,
    minStayMonths: 5,
    photoCount: 2
  },
  {
    hostIndex: 0,
    title: "Комната в Жетысуском районе, можно с питомцем",
    description:
      "Редкий вариант — хозяева не против кошки или небольшой собаки. Комната 15 м², квартира на втором этаже, во дворе есть где погулять с питомцем. Соседи любят животных, сами держат кота.",
    city: "almaty",
    district: "Жетысуский",
    address: "ул. Емцова, дом 8",
    monthlyRent: 105000,
    deposit: 90000,
    totalRooms: 3,
    availableRooms: 1,
    currentOccupants: 2,
    maxOccupants: 3,
    petsAllowed: true,
    smokingAllowed: "outside",
    genderPreference: "any",
    minAge: 20,
    maxAge: 40,
    furnished: true,
    internetIncluded: true,
    minStayMonths: 3,
    photoCount: 2
  },
  {
    hostIndex: 1,
    title: "Светлая комната в Шымкенте, Аль-Фарабийский район",
    description:
      "Тёплый климат, недорогая аренда. Комната в хорошей квартире рядом с центральным парком. Подойдёт молодому специалисту или паре студентов. Хозяйка показывает квартиру в любое удобное время.",
    city: "shymkent",
    district: "Аль-Фарабийский",
    address: "ул. Тауке хана, дом 41",
    monthlyRent: 75000,
    deposit: 60000,
    totalRooms: 2,
    availableRooms: 1,
    currentOccupants: 1,
    maxOccupants: 2,
    petsAllowed: false,
    smokingAllowed: "outside",
    genderPreference: "any",
    minAge: 19,
    maxAge: 35,
    furnished: true,
    internetIncluded: true,
    minStayMonths: 3,
    photoCount: 2
  },
  {
    hostIndex: 2,
    title: "Комната с балконом, Наурызбайский район",
    description:
      "Новый микрорайон на окраине Алматы — чистый воздух, вид на горы. Комната с застеклённым балконом. Дорога в центр около 30 минут на машине. Идеально для тех, кто работает удалённо.",
    city: "almaty",
    district: "Наурызбайский",
    address: "мкр. Шугыла, дом 340",
    monthlyRent: 100000,
    deposit: 100000,
    totalRooms: 3,
    availableRooms: 2,
    currentOccupants: 1,
    maxOccupants: 3,
    petsAllowed: false,
    smokingAllowed: "no",
    genderPreference: "any",
    minAge: 21,
    maxAge: 40,
    furnished: true,
    internetIncluded: true,
    minStayMonths: 4,
    photoCount: 3
  },
  {
    hostIndex: 3,
    title: "Комната в Алматинском районе Астаны, недорого",
    description:
      "Спокойный жилой район, развитая инфраструктура. Комната сдаётся без мебели — можно обставить под себя, цена за это снижена. Хороший вариант на длительный срок для работающего человека.",
    city: "astana",
    district: "Алматинский",
    address: "ул. Майлина, дом 14",
    monthlyRent: 80000,
    deposit: 80000,
    totalRooms: 2,
    availableRooms: 1,
    currentOccupants: 1,
    maxOccupants: 2,
    petsAllowed: false,
    smokingAllowed: "outside",
    genderPreference: "any",
    minAge: 20,
    maxAge: 45,
    furnished: false,
    internetIncluded: false,
    minStayMonths: 6,
    photoCount: 2
  }
];

const pick = (arr, i) => arr[i % arr.length];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Clear in FK-safe order.
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
      fullName: "Администратор Roomie.kz",
      phone: "+77010000000",
      role: "admin",
      occupation: "Модератор платформы",
      isPhoneVerified: true,
      isIdVerified: true
    }
  });

  const hosts = [];
  for (const h of HOSTS) {
    hosts.push(
      await prisma.user.create({
        data: {
          email: h.email,
          passwordHash,
          fullName: h.fullName,
          phone: h.phone,
          role: "host",
          occupation: h.occupation,
          bio: h.bio,
          isPhoneVerified: true,
          isIdVerified: h.isIdVerified
        }
      })
    );
  }

  const seekers = [];
  for (let i = 0; i < SEEKERS.length; i += 1) {
    const s = SEEKERS[i];
    seekers.push(
      await prisma.user.create({
        data: {
          email: s.email,
          passwordHash,
          fullName: s.fullName,
          phone: s.phone,
          role: "seeker",
          occupation: s.occupation,
          bio: s.bio,
          isPhoneVerified: i % 4 !== 0,
          isIdVerified: i % 3 === 0
        }
      })
    );
  }

  // Lifestyle profiles — varied but plausible.
  const sleep = ["early_bird", "night_owl", "flexible"];
  const guests = ["rare", "sometimes", "often"];
  const diets = ["any", "vegetarian", "halal", "any"];
  const allUsers = [admin, ...hosts, ...seekers];
  for (let i = 0; i < allUsers.length; i += 1) {
    await prisma.lifestyleProfile.create({
      data: {
        userId: allUsers[i].id,
        sleepSchedule: pick(sleep, i),
        cleanliness: 3 + (i % 3),
        smoking: i % 4 === 0 ? "outside" : "no",
        petsOk: i % 2 === 0,
        guestsFrequency: pick(guests, i),
        noiseTolerance: 2 + (i % 4),
        diet: pick(diets, i),
        hasPets: i % 5 === 0,
        workFromHome: i % 3 === 0
      }
    });
  }

  // Listings with bills + house rules.
  const listings = [];
  for (let i = 0; i < LISTINGS.length; i += 1) {
    const def = LISTINGS[i];
    const host = hosts[def.hostIndex];
    const photos = Array.from(
      { length: def.photoCount },
      (_, k) => ROOM_PHOTOS[(i * 3 + k) % ROOM_PHOTOS.length]
    );

    const listing = await prisma.listing.create({
      data: {
        hostId: host.id,
        title: def.title,
        description: def.description,
        city: def.city,
        district: def.district,
        address: def.address,
        monthlyRent: def.monthlyRent,
        deposit: def.deposit,
        totalRooms: def.totalRooms,
        availableRooms: def.availableRooms,
        currentOccupants: def.currentOccupants,
        maxOccupants: def.maxOccupants,
        petsAllowed: def.petsAllowed,
        smokingAllowed: def.smokingAllowed,
        genderPreference: def.genderPreference,
        minAge: def.minAge,
        maxAge: def.maxAge,
        furnished: def.furnished,
        internetIncluded: def.internetIncluded,
        minStayMonths: def.minStayMonths,
        photos,
        status: "active",
        // One listing left pending moderation so the admin queue isn't empty.
        isApproved: i !== LISTINGS.length - 1
      }
    });
    listings.push(listing);

    await prisma.bill.createMany({
      data: [
        {
          listingId: listing.id,
          category: "rent",
          label: "Аренда комнаты",
          amountKzt: def.monthlyRent,
          isIncludedInRent: true
        },
        {
          listingId: listing.id,
          category: "utilities",
          label: "Коммунальные услуги",
          amountKzt: 15000 + (i % 4) * 3000,
          isIncludedInRent: false,
          notes: "Делится поровну между жильцами"
        },
        {
          listingId: listing.id,
          category: "internet",
          label: "Интернет и ТВ",
          amountKzt: 7000,
          isIncludedInRent: def.internetIncluded
        }
      ]
    });

    await prisma.houseRule.createMany({
      data: [
        { listingId: listing.id, ruleText: "Тишина после 23:00", orderIndex: 0 },
        {
          listingId: listing.id,
          ruleText: def.petsAllowed
            ? "Питомцы разрешены по согласованию"
            : "Без домашних животных",
          orderIndex: 1
        },
        {
          listingId: listing.id,
          ruleText:
            def.smokingAllowed === "no"
              ? "Курение в квартире запрещено"
              : "Курение только на балконе или улице",
          orderIndex: 2
        },
        {
          listingId: listing.id,
          ruleText: "Уборка общих зон по очереди",
          orderIndex: 3
        }
      ]
    });
  }

  // Applications — a realistic spread of statuses across several listings.
  const applicationPlan = [
    {
      seeker: 0,
      listing: 2,
      status: "pending",
      message:
        "Здравствуйте! Я студентка КИМЭП, ищу комнату для девушки. Очень аккуратная, не курю. Могу заехать с начала месяца."
    },
    {
      seeker: 1,
      listing: 4,
      status: "accepted",
      message:
        "Добрый день! Работаю из дома, мне важен тихий район и хороший интернет. Готов внести депозит сразу."
    },
    {
      seeker: 2,
      listing: 6,
      status: "pending",
      message:
        "Здравствуйте! Работаю медсестрой посменно, веду спокойный образ жизни. Можно посмотреть квартиру на выходных?"
    },
    {
      seeker: 3,
      listing: 7,
      status: "pending",
      message:
        "Салеметсіз бе! Магистрант НУ, ищу жильё на учебный год рядом с ЕНУ. Очень заинтересован."
    },
    {
      seeker: 4,
      listing: 8,
      status: "accepted",
      message:
        "Здравствуйте! У меня спокойный кот, увидела, что с питомцем можно. Работаю дизайнером удалённо."
    },
    {
      seeker: 5,
      listing: 4,
      status: "rejected",
      message:
        "Добрый день, интересует комната. Часто бываю в разъездах, дома почти не бываю."
    },
    {
      seeker: 6,
      listing: 0,
      status: "pending",
      message:
        "Здравствуйте! Студентка медицинского, ищу спокойную квартиру недалеко от учёбы. Не курю."
    },
    {
      seeker: 0,
      listing: 10,
      status: "withdrawn",
      message:
        "Добрый день! Рассматриваю варианты, но пока не определилась с районом."
    }
  ];
  for (const a of applicationPlan) {
    await prisma.application.create({
      data: {
        listingId: listings[a.listing].id,
        seekerId: seekers[a.seeker].id,
        message: a.message,
        status: a.status
      }
    });
  }

  // Favorites — seekers bookmarking listings they like.
  const favoritePlan = [
    [0, 0],
    [0, 6],
    [1, 1],
    [1, 4],
    [2, 2],
    [3, 7],
    [4, 8],
    [6, 3]
  ];
  for (const [s, l] of favoritePlan) {
    await prisma.favorite.create({
      data: { userId: seekers[s].id, listingId: listings[l].id }
    });
  }

  // Reviews — seekers who lived with a host leaving feedback.
  await prisma.review.create({
    data: {
      reviewerId: seekers[1].id,
      revieweeId: hosts[1].id,
      rating: 5,
      comment:
        "Прожил полгода — хозяйка очень порядочная, квартира всегда чистая. Рекомендую."
    }
  });
  await prisma.review.create({
    data: {
      reviewerId: seekers[4].id,
      revieweeId: hosts[0].id,
      rating: 4,
      comment:
        "Хорошие условия, спокойные соседи. Единственное — интернет иногда подвисал."
    }
  });
  await prisma.review.create({
    data: {
      reviewerId: seekers[3].id,
      revieweeId: hosts[3].id,
      rating: 5,
      comment: "Тёплая квартира, всё как на фото. Заселение прошло без проблем."
    }
  });

  // Saved searches.
  const searchPlan = [
    {
      seeker: 0,
      name: "Комната для девушки в Алматы",
      filter: { city: "almaty", maxPrice: 140000, genderPreference: "female" }
    },
    {
      seeker: 1,
      name: "Тихие квартиры с интернетом",
      filter: { city: "almaty", internetIncluded: "true", maxPrice: 170000 }
    },
    {
      seeker: 3,
      name: "Жильё в Астане у ЕНУ",
      filter: { city: "astana", maxPrice: 110000, furnished: "true" }
    }
  ];
  for (const s of searchPlan) {
    await prisma.savedSearch.create({
      data: {
        userId: seekers[s.seeker].id,
        name: s.name,
        filterJson: s.filter
      }
    });
  }

  // ID verifications — a couple approved, one still pending in the admin queue.
  await prisma.idVerification.create({
    data: {
      userId: seekers[0].id,
      imageUrl: "https://example.com/uploads/id-aruzhan-bekova.jpg",
      status: "approved",
      adminNote: "Документ читаемый, данные совпадают."
    }
  });
  await prisma.idVerification.create({
    data: {
      userId: seekers[3].id,
      imageUrl: "https://example.com/uploads/id-alikhan-serik.jpg",
      status: "approved"
    }
  });
  await prisma.idVerification.create({
    data: {
      userId: seekers[2].id,
      imageUrl: "https://example.com/uploads/id-madina-zhumabayeva.jpg",
      status: "pending"
    }
  });

  console.log("Seed completed:");
  console.log(`- 1 admin, ${hosts.length} hosts, ${seekers.length} seekers`);
  console.log(`- ${listings.length} active listings with bills + house rules`);
  console.log(
    `- ${applicationPlan.length} applications, ${favoritePlan.length} favorites, 3 reviews, ${searchPlan.length} saved searches, 3 ID verifications`
  );
  console.log(`\nAll accounts use password: ${DEMO_PASSWORD}`);
  console.log("Admin login: admin@roomie.kz");
  console.log(`Sample host:   ${HOSTS[0].email}`);
  console.log(`Sample seeker: ${SEEKERS[0].email}`);
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
