/* eslint-disable no-console */
// Realistic demo seed for Roomie.kz.
//
// Everything written here lands in PostgreSQL through Prisma — the app reads it
// back via the normal API, nothing is mocked. Re-running wipes the demo tables
// and regenerates a deterministic dataset (fixed RNG seed) so IDs/counts stay
// stable between runs.
import bcrypt from "bcryptjs";
import prismaPkg from "@prisma/client";

const { PrismaClient } = prismaPkg;
const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Deterministic RNG so the demo data is reproducible across seed runs.
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260522);
const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const pickN = (arr, n) => {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
  }
  return out;
};
const chance = (p) => rng() < p;

// ---------------------------------------------------------------------------
// Reference data: cities, districts, streets, universities (Kazakhstan).
// City slugs MUST match frontend/src/constants/cities.js.
// ---------------------------------------------------------------------------
const CITY_DATA = {
  almaty: {
    districts: [
      "Медеуский",
      "Бостандыкский",
      "Алмалинский",
      "Ауэзовский",
      "Турксибский",
      "Жетысуский",
      "Наурызбайский",
      "Алатауский",
    ],
    streets: [
      "проспект Аль-Фараби",
      "улица Сатпаева",
      "проспект Достык",
      "улица Тимирязева",
      "улица Жандосова",
      "улица Розыбакиева",
      "микрорайон Самал-2",
      "микрорайон Орбита-3",
      "улица Толе би",
      "проспект Абая",
      "улица Гагарина",
    ],
    universities: [
      "КазНУ им. аль-Фараби",
      "КБТУ",
      "AlmaU",
      "KIMEP",
      "СДУ",
      "Сатпаев Университет",
    ],
    rent: [80000, 220000],
  },
  astana: {
    districts: ["Есильский", "Алматинский", "Сарыаркинский", "Байконурский", "Нура"],
    streets: [
      "проспект Кабанбай батыра",
      "улица Сыганак",
      "проспект Туран",
      "улица Достык",
      "проспект Мангилик Ел",
      "улица Кошкарбаева",
      "улица Жубанова",
    ],
    universities: [
      "Nazarbayev University",
      "ЕНУ им. Гумилёва",
      "Astana IT University",
      "КазАТУ им. Сейфуллина",
    ],
    rent: [75000, 190000],
  },
  shymkent: {
    districts: ["Аль-Фарабийский", "Абайский", "Енбекшинский", "Каратауский", "Туран"],
    streets: [
      "проспект Тауке хана",
      "улица Байтурсынова",
      "проспект Республики",
      "улица Казыбек би",
      "улица Желтоксан",
    ],
    universities: ["ЮКУ им. Ауэзова", "Университет Мирас"],
    rent: [55000, 120000],
  },
  karaganda: {
    districts: ["Казыбекбийский", "Октябрьский"],
    streets: [
      "проспект Бухар жырау",
      "улица Гоголя",
      "проспект Нуркена Абдирова",
      "улица Ермекова",
    ],
    universities: ["КарУ им. Букетова", "Карагандинский медицинский университет"],
    rent: [55000, 110000],
  },
  pavlodar: {
    districts: ["Центральный", "Северный", "Усольский"],
    streets: [
      "улица Сатпаева",
      "улица Торайгырова",
      "улица Естая",
      "улица Академика Чокина",
    ],
    universities: ["Торайгыров Университет", "ПГУ им. Торайгырова"],
    rent: [50000, 100000],
  },
};
// Weighted city draw — Almaty/Astana dominate the marketplace.
const CITY_POOL = [
  "almaty",
  "almaty",
  "almaty",
  "almaty",
  "astana",
  "astana",
  "astana",
  "shymkent",
  "shymkent",
  "karaganda",
  "pavlodar",
];

// ---------------------------------------------------------------------------
// People: Kazakh / Russian names, gendered surnames, emails via transliteration.
// ---------------------------------------------------------------------------
const MALE_NAMES = [
  "Арман", "Нурлан", "Ержан", "Дамир", "Алибек", "Нурсултан", "Ислам",
  "Темирлан", "Бекзат", "Санжар", "Ерасыл", "Алишер", "Олжас", "Мирас",
  "Адиль", "Чингиз", "Айдос", "Тимур", "Руслан", "Бахытжан", "Олег",
  "Сергей", "Дмитрий", "Данияр", "Аян", "Жанибек", "Мейрам", "Ансар",
];
const FEMALE_NAMES = [
  "Айгерим", "Дана", "Аяулым", "Камила", "Жания", "Сабина", "Айдана",
  "Меруерт", "Аружан", "Динара", "Малика", "Томирис", "Зарина", "Карина",
  "Асель", "Жанель", "Лаура", "Айша", "Алия", "Гульнара", "Назгуль",
  "Мадина", "Виктория", "Сауле", "Дария", "Алина", "Инкар", "Балжан",
];
const SURNAMES = [
  "Нурланов", "Сериков", "Бекмуратов", "Жумабеков", "Калиев", "Оспанов",
  "Ермеков", "Тулегенов", "Сапаров", "Абенов", "Касымов", "Айтбаев",
  "Досжанов", "Муканов", "Жаксыбеков", "Сыдыков", "Алимов", "Бейсенов",
  "Турсынов", "Кенжебаев", "Аманжолов", "Искаков", "Рахимов", "Сулейменов",
  "Омаров", "Ким", "Цой", "Ли", "Пак", "Тен",
];

function feminizeSurname(s) {
  if (s.endsWith("ский")) return `${s.slice(0, -2)}ая`;
  if (/(ов|ев|ёв|ин)$/.test(s)) return `${s}а`;
  return s; // Ким, Цой, Ли, Пак, Тен — unchanged
}

const TRANSLIT = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh",
  щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};
const translit = (s) =>
  s
    .toLowerCase()
    .split("")
    .map((c) => (c in TRANSLIT ? TRANSLIT[c] : c))
    .join("")
    .replace(/[^a-z0-9]/g, "");

const EMAIL_DOMAINS = ["gmail.com", "mail.ru", "inbox.kz", "bk.ru"];
const usedEmails = new Set();
function emailFor(first, surname) {
  const base = `${translit(first)}.${translit(surname)}`;
  let candidate = `${base}@${pick(EMAIL_DOMAINS)}`;
  let n = 1;
  while (usedEmails.has(candidate)) {
    candidate = `${base}${n}@${pick(EMAIL_DOMAINS)}`;
    n += 1;
  }
  usedEmails.add(candidate);
  return candidate;
}

const HOST_OCCUPATIONS = [
  "IT-специалист", "Преподаватель", "Врач", "Маркетолог", "Предприниматель",
  "Дизайнер", "Бухгалтер", "Инженер", "Менеджер проектов", "Фрилансер",
];
const HOST_BIOS = [
  "Сдаю комнату в просторной квартире. Ищу аккуратного и ответственного соседа.",
  "Хозяйка квартиры, живу рядом. Помогу с заселением, отвечаю быстро.",
  "Сдаю место студентам. Рядом метро и университеты — всё для комфортной учёбы.",
  "Уютная квартира, дружелюбная атмосфера. Без шумных вечеринок.",
  "Сдаю комнату надолго. Ценю порядок и взаимоуважение.",
];
const SEEKER_BIOS = [
  "Студент, ищу спокойное жильё рядом с университетом. Чистоплотный, не курю.",
  "Ищу комнату с адекватными соседями. Люблю тишину и порядок.",
  "Переезжаю на учёбу, ищу место в дружной квартире на длительный срок.",
  "Спокойный сосед, занимаюсь спортом, без вредных привычек.",
  "Ищу комнату ближе к центру. Готов(а) заехать в ближайшее время.",
  "Магистрант, работаю удалённо. Ценю чистоту и взаимоуважение.",
  "Активный, общительный, но уважаю личное пространство соседей.",
];

const today = new Date();
const dobForAge = (age) =>
  new Date(today.getFullYear() - age, randInt(0, 11), randInt(1, 28));

let phoneSeq = 7010000000;
const nextPhone = () => `+7${phoneSeq++}`;

// ---------------------------------------------------------------------------
// Listing building blocks.
// ---------------------------------------------------------------------------
const PHOTO_IDS = [
  "photo-1522708323590-d24dbb6b0267",
  "photo-1502672260266-1c1ef2d93688",
  "photo-1505691938895-1758d7feb511",
  "photo-1493809842364-78817add7ffb",
  "photo-1567767292278-a4f21aa2d36e",
  "photo-1484154218962-a197022b5858",
  "photo-1493666438817-866a91353ca9",
  "photo-1560448204-e02f11c3d0e2",
  "photo-1554995207-c18c203602cb",
  "photo-1556912173-3bb406ef7e77",
  "photo-1540518614846-7eded433c457",
  "photo-1598928506311-c55ded91a20c",
];
const photoUrl = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const TITLE_TEMPLATES = [
  ({ rooms, uni }) => `Комната в ${rooms}-комнатной рядом с ${uni}`,
  ({ district }) => `Место для студента, ${district} район`,
  ({ cityLabel }) => `Светлая комната у метро, ${cityLabel}`,
  ({ district }) => `Уютная студия в центре, ${district} район`,
  () => "Большая комната с балконом для девушки",
  ({ uni }) => `Койко-место недалеко от ${uni}`,
  ({ district }) => `Комната в тихом дворе, ${district} район`,
  ({ cityLabel }) => `Современная квартира с двумя соседями, ${cityLabel}`,
];
const DESCRIPTIONS = [
  "Светлая квартира с хорошим ремонтом, дружелюбные соседи и понятные правила проживания.",
  "Просторная комната, вся необходимая мебель и бытовая техника. Рядом магазины и остановки.",
  "Тихий район, развитая инфраструктура. До центра 15 минут на транспорте.",
  "Чистая и ухоженная квартира. Соседи — спокойные ребята, которые ценят порядок.",
  "Отличный вариант для студентов: рядом университеты, кафе и парк.",
  "Уютное жильё с быстрым интернетом и удобным расположением для работы и учёбы.",
];
const HOUSE_RULES = [
  "Тишина после 23:00",
  "Уборка по графику",
  "Без шумных вечеринок",
  "Курение только на балконе",
  "Гости — по договорённости",
  "Без курения в квартире",
  "Раздельная оплата коммунальных",
  "Питомцы по согласованию",
];
const CITY_LABEL_RU = {
  almaty: "Алматы",
  astana: "Астана",
  shymkent: "Шымкент",
  karaganda: "Караганда",
  pavlodar: "Павлодар",
};

// Cities are a DB-backed resource managed by super admins; these are the
// initial rows. Slugs must match what listings store and what the frontend
// dropdowns expect.
const CITY_SEED = [
  { slug: "almaty", nameRu: "Алматы", imageUrl: "https://images.unsplash.com/photo-1594823976738-35aefcc1c87a?auto=format&fit=crop&w=800&q=60", sortOrder: 1 },
  { slug: "astana", nameRu: "Астана", imageUrl: "https://images.unsplash.com/photo-1564509370334-5b6b81f1f9cc?auto=format&fit=crop&w=800&q=60", sortOrder: 2 },
  { slug: "shymkent", nameRu: "Шымкент", imageUrl: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=60", sortOrder: 3 },
  { slug: "karaganda", nameRu: "Караганда", imageUrl: "https://images.unsplash.com/photo-1496568816309-51d7c20e3b21?auto=format&fit=crop&w=800&q=60", sortOrder: 4 },
  { slug: "pavlodar", nameRu: "Павлодар", imageUrl: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=800&q=60", sortOrder: 5 },
];

const NEIGHBORHOOD_IMAGES = [
  "https://images.unsplash.com/photo-1549893077-a3caa2f9b6c3?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1519121785383-3229633bb75b?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1519642918688-7e43b19245d8?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1515263487990-61b07816b324?auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1528901166007-3784c7dd3653?auto=format&fit=crop&w=800&q=60",
];

const NEIGHBORHOOD_TAGS = [
  ["Транспорт", "Учёба", "Кафе"],
  ["Парки", "Тишина", "Семьи"],
  ["Центр", "Работа", "Метро"],
  ["Новостройки", "Деловой", "ТЦ"],
  ["Бюджетно", "Магазины", "Остановки"],
];

const NEIGHBORHOOD_SEED = Object.entries(CITY_DATA).flatMap(
  ([citySlug, meta], cityIndex) =>
    meta.districts.map((name, index) => ({
      citySlug,
      name,
      description: `${name} район города ${CITY_LABEL_RU[citySlug]}: удобный доступ к транспорту, учёбе и повседневной инфраструктуре.`,
      imageUrl: NEIGHBORHOOD_IMAGES[(cityIndex + index) % NEIGHBORHOOD_IMAGES.length],
      priceLabel: `От ${Math.round(meta.rent[0] / 1000)} 000 ₸`,
      trendLabel: `+${3 + ((cityIndex + index) % 8)}%`,
      tags: NEIGHBORHOOD_TAGS[(cityIndex + index) % NEIGHBORHOOD_TAGS.length],
      sortOrder: index + 1,
    }))
);

const APPLICATION_MESSAGES = [
  "Здравствуйте! Я аккуратный и спокойный, готов заселиться в ближайший месяц.",
  "Добрый день! Очень понравился вариант. Можно узнать, свободна ли комната?",
  "Привет! Студент(ка), не курю, без животных. Когда можно посмотреть жильё?",
  "Здравствуйте, ищу жильё на длительный срок. Готова к заселению на следующей неделе.",
  "Заинтересовал ваш вариант. Работаю удалённо, тихий и чистоплотный сосед.",
];
const REVIEW_COMMENTS = [
  "Отличный сосед, всё чисто и спокойно. Рекомендую!",
  "Очень комфортное проживание, хозяин отзывчивый.",
  "Всё как на фото, заселение прошло без проблем.",
  "Приятные соседи, тихий район. Остались только хорошие впечатления.",
  "Хозяин быстро отвечает и помогает по всем вопросам.",
  "Хорошая квартира, но иногда бывает шумно от соседей сверху.",
];

async function main() {
  const passwordHash = await bcrypt.hash("Roomie123!", 10);

  // Wipe demo tables (respecting FK order).
  await prisma.review.deleteMany();
  await prisma.application.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.houseRule.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.idVerification.deleteMany();
  await prisma.emailVerification.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.lifestyleProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.neighborhood.deleteMany();
  await prisma.city.deleteMany();

  // ----- Cities (super-admin-managed catalogue) ----------------------------
  await prisma.city.createMany({ data: CITY_SEED });
  const cities = await prisma.city.findMany({ select: { id: true, slug: true } });
  const cityBySlug = Object.fromEntries(cities.map((city) => [city.slug, city]));
  await prisma.neighborhood.createMany({
    data: NEIGHBORHOOD_SEED.map(({ citySlug, ...neighborhood }) => ({
      ...neighborhood,
      cityId: cityBySlug[citySlug].id,
    })),
  });

  // ----- Users -------------------------------------------------------------
  const HOST_COUNT = 14;
  const SEEKER_COUNT = 35;

  const buildUser = (index, role) => {
    const gender = chance(0.5) ? "male" : "female";
    const first = gender === "male" ? pick(MALE_NAMES) : pick(FEMALE_NAMES);
    const baseSurname = pick(SURNAMES);
    const surname = gender === "female" ? feminizeSurname(baseSurname) : baseSurname;
    const fullName = `${first} ${surname}`;
    const homeCity = pick(CITY_POOL);
    const isStudent = role === "seeker" ? true : chance(0.2);
    const occupation = isStudent
      ? `${gender === "female" ? "Студентка" : "Студент"} · ${pick(CITY_DATA[homeCity].universities)}`
      : pick(HOST_OCCUPATIONS);
    const age = isStudent ? randInt(18, 25) : randInt(25, 45);

    // ID verification plan drives isIdVerified.
    let idPlan = null;
    if (chance(0.45)) idPlan = pick(["approved", "approved", "pending", "rejected"]);

    return {
      data: {
        email: emailFor(first, surname),
        passwordHash,
        fullName,
        phone: nextPhone(),
        role,
        gender,
        dateOfBirth: dobForAge(age),
        occupation,
        bio: role === "host" ? pick(HOST_BIOS) : pick(SEEKER_BIOS),
        avatarUrl: `https://i.pravatar.cc/150?img=${randInt(1, 70)}`,
        isEmailVerified: chance(0.9),
        isPhoneVerified: chance(0.7),
        isIdVerified: idPlan === "approved",
      },
      idPlan,
    };
  };

  const superAdmin = await prisma.user.create({
    data: {
      email: "superadmin@roomie.kz",
      passwordHash,
      fullName: "Roomie Super Admin",
      phone: "+77010000999",
      role: "super_admin",
      gender: "male",
      occupation: "Супер-администратор платформы",
      isEmailVerified: true,
      isPhoneVerified: true,
      isIdVerified: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@roomie.kz",
      passwordHash,
      fullName: "Roomie Admin",
      phone: "+77010000777",
      role: "admin",
      gender: "male",
      occupation: "Администратор платформы",
      isEmailVerified: true,
      isPhoneVerified: true,
      isIdVerified: true,
    },
  });

  const hosts = [];
  const seekers = [];
  const idPlans = []; // { userId, status }

  for (let i = 0; i < HOST_COUNT; i += 1) {
    const { data, idPlan } = buildUser(i, "host");
    const user = await prisma.user.create({ data });
    hosts.push(user);
    if (idPlan) idPlans.push({ userId: user.id, status: idPlan });
  }
  for (let i = 0; i < SEEKER_COUNT; i += 1) {
    const { data, idPlan } = buildUser(i, "seeker");
    const user = await prisma.user.create({ data });
    seekers.push(user);
    if (idPlan) idPlans.push({ userId: user.id, status: idPlan });
  }

  const allUsers = [superAdmin, admin, ...hosts, ...seekers];

  // ----- Lifestyle profiles -------------------------------------------------
  await prisma.lifestyleProfile.createMany({
    data: allUsers.map((user) => ({
      userId: user.id,
      sleepSchedule: pick(["early_bird", "night_owl", "flexible"]),
      cleanliness: randInt(2, 5),
      smoking: pick(["no", "no", "outside", "yes"]),
      petsOk: chance(0.6),
      guestsFrequency: pick(["rare", "sometimes", "often"]),
      noiseTolerance: randInt(1, 5),
      diet: pick(["any", "any", "halal", "vegetarian", "vegan"]),
      hasPets: chance(0.2),
      workFromHome: chance(0.4),
    })),
  });

  // ----- ID verifications ---------------------------------------------------
  if (idPlans.length) {
    await prisma.idVerification.createMany({
      data: idPlans.map(({ userId, status }) => ({
        userId,
        imageUrl: `https://example.com/id-cards/user-${userId}.jpg`,
        status,
        adminNote:
          status === "rejected"
            ? "Документ нечитаемый, загрузите фото лучшего качества."
            : status === "approved"
              ? "Личность подтверждена."
              : null,
      })),
    });
  }

  // ----- Listings -----------------------------------------------------------
  const LISTING_COUNT = 40;
  const listings = [];

  for (let i = 0; i < LISTING_COUNT; i += 1) {
    const host = pick(hosts);
    const city = pick(CITY_POOL);
    const meta = CITY_DATA[city];
    const district = pick(meta.districts);
    const uni = pick(meta.universities);
    const cityLabel = CITY_LABEL_RU[city];

    const totalRooms = randInt(1, 4);
    const maxOccupants = totalRooms + (chance(0.4) ? 1 : 0);
    const currentOccupants = randInt(0, Math.max(0, maxOccupants - 1));
    const availableRooms = Math.max(1, maxOccupants - currentOccupants);

    const [rentMin, rentMax] = meta.rent;
    const monthlyRent = Math.round((randInt(rentMin, rentMax) / 1000)) * 1000;
    const deposit = chance(0.8)
      ? Math.round((monthlyRent * (chance(0.5) ? 0.5 : 1)) / 1000) * 1000
      : null;

    // Status mix: most active+approved, a few in other states for admin demos.
    let status = "active";
    let isApproved = true;
    if (i % 13 === 0) {
      isApproved = false; // pending moderation
    } else if (i % 11 === 0) {
      status = "rented";
    } else if (i % 17 === 0) {
      status = "draft";
      isApproved = false;
    } else if (i % 19 === 0) {
      status = "archived";
    }

    const genderPreference = pick(["any", "any", "male", "female"]);
    const title = pick(TITLE_TEMPLATES)({ rooms: totalRooms, uni, district, cityLabel });

    const availableFrom = new Date(today);
    availableFrom.setDate(availableFrom.getDate() + pick([0, 0, 7, 14, 30, 45]));

    const listing = await prisma.listing.create({
      data: {
        hostId: host.id,
        title,
        description: `${pick(DESCRIPTIONS)} Рядом ${uni}.`,
        city,
        district,
        address: `${pick(meta.streets)}, дом ${randInt(1, 180)}`,
        latitude: null,
        longitude: null,
        monthlyRent,
        deposit,
        totalRooms,
        availableRooms,
        currentOccupants,
        maxOccupants,
        petsAllowed: chance(0.35),
        smokingAllowed: pick(["no", "no", "outside", "yes"]),
        genderPreference,
        minAge: 18,
        maxAge: pick([28, 30, 35, 40]),
        furnished: chance(0.85),
        internetIncluded: chance(0.7),
        availableFrom,
        minStayMonths: pick([3, 6, 6, 12]),
        photos: pickN(PHOTO_IDS, 3).map(photoUrl),
        status,
        isApproved,
      },
    });
    listings.push(listing);

    // Bills
    const bills = [
      {
        listingId: listing.id,
        category: "rent",
        label: "Базовая аренда",
        amountKzt: monthlyRent,
        isIncludedInRent: true,
      },
      {
        listingId: listing.id,
        category: "utilities",
        label: "Коммунальные услуги",
        amountKzt: randInt(8, 25) * 1000,
        isIncludedInRent: chance(0.3),
      },
      {
        listingId: listing.id,
        category: "internet",
        label: "Интернет",
        amountKzt: randInt(5, 8) * 1000,
        isIncludedInRent: chance(0.5),
      },
    ];
    if (chance(0.4)) {
      bills.push({
        listingId: listing.id,
        category: "cleaning",
        label: "Уборка общих зон",
        amountKzt: randInt(4, 8) * 1000,
        isIncludedInRent: false,
      });
    }
    await prisma.bill.createMany({ data: bills });

    // House rules
    await prisma.houseRule.createMany({
      data: pickN(HOUSE_RULES, randInt(3, 4)).map((ruleText, idx) => ({
        listingId: listing.id,
        ruleText,
        orderIndex: idx,
      })),
    });
  }

  // ----- Applications -------------------------------------------------------
  const activeListings = listings.filter((l) => l.status === "active");
  const applicationRows = [];
  const seenApp = new Set();
  for (const listing of activeListings) {
    if (chance(0.35)) continue; // not every listing has applicants
    const applicants = pickN(seekers, randInt(1, 3));
    applicants.forEach((seeker, idx) => {
      const key = `${listing.id}:${seeker.id}`;
      if (seenApp.has(key)) return;
      seenApp.add(key);
      const status = pick([
        "pending",
        "pending",
        "pending",
        "accepted",
        "rejected",
        "withdrawn",
      ]);
      applicationRows.push({
        listingId: listing.id,
        seekerId: seeker.id,
        message: pick(APPLICATION_MESSAGES),
        status,
      });
    });
  }
  await prisma.application.createMany({ data: applicationRows, skipDuplicates: true });

  // ----- Favorites ----------------------------------------------------------
  const favoriteRows = [];
  const seenFav = new Set();
  for (const seeker of seekers) {
    const faves = pickN(listings, randInt(0, 5));
    for (const listing of faves) {
      const key = `${seeker.id}:${listing.id}`;
      if (seenFav.has(key)) continue;
      seenFav.add(key);
      favoriteRows.push({ userId: seeker.id, listingId: listing.id });
    }
  }
  await prisma.favorite.createMany({ data: favoriteRows, skipDuplicates: true });

  // ----- Reviews (seekers -> hosts, plus a few hosts -> seekers) ------------
  const reviewRows = [];
  for (let i = 0; i < 32; i += 1) {
    const reviewer = pick(seekers);
    const reviewee = pick(hosts);
    if (reviewer.id === reviewee.id) continue;
    reviewRows.push({
      reviewerId: reviewer.id,
      revieweeId: reviewee.id,
      rating: pick([3, 4, 4, 5, 5, 5]),
      comment: pick(REVIEW_COMMENTS),
    });
  }
  for (let i = 0; i < 8; i += 1) {
    const reviewer = pick(hosts);
    const reviewee = pick(seekers);
    reviewRows.push({
      reviewerId: reviewer.id,
      revieweeId: reviewee.id,
      rating: pick([4, 4, 5, 5]),
      comment: pick(REVIEW_COMMENTS),
    });
  }
  await prisma.review.createMany({ data: reviewRows });

  // ----- Saved searches -----------------------------------------------------
  const savedSearchRows = [];
  for (const seeker of pickN(seekers, 22)) {
    const count = randInt(1, 2);
    for (let i = 0; i < count; i += 1) {
      const city = pick(CITY_POOL);
      savedSearchRows.push({
        userId: seeker.id,
        name: `Поиск в ${CITY_LABEL_RU[city]}`,
        filterJson: {
          city,
          minPrice: pick([60000, 80000, 100000]),
          maxPrice: pick([150000, 180000, 220000]),
          furnished: chance(0.5),
          genderPreference: pick(["any", "male", "female"]),
        },
      });
    }
  }
  await prisma.savedSearch.createMany({ data: savedSearchRows });

  // ----- Summary ------------------------------------------------------------
  const cityCounts = await prisma.listing.groupBy({
    by: ["city"],
    _count: { _all: true },
  });

  console.log("Seed completed:");
  console.log(`- ${CITY_SEED.length} cities (super-admin-managed)`);
  console.log(`- 1 super admin (superadmin@roomie.kz / Roomie123!)`);
  console.log(`- 1 admin (admin@roomie.kz / Roomie123!)`);
  console.log(`- ${hosts.length} hosts`);
  console.log(`- ${seekers.length} seekers`);
  console.log(`- ${listings.length} listings (with bills + house rules)`);
  console.log(`- ${applicationRows.length} applications`);
  console.log(`- ${favoriteRows.length} favorites`);
  console.log(`- ${reviewRows.length} reviews`);
  console.log(`- ${savedSearchRows.length} saved searches`);
  console.log(`- ${idPlans.length} id verifications`);
  console.log(
    "Listings by city:",
    cityCounts.map((c) => `${c.city}=${c._count._all}`).join(", ")
  );
  console.log("All demo users share the password: Roomie123!");
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
