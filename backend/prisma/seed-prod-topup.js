/* eslint-disable no-console */
// Additive production top-up seed for Roomie.kz.
//
// Unlike prisma/seed.js (which wipes ALL tables), this script is NON-DESTRUCTIVE
// to real users. It:
//   - upserts a small set of demo hosts (idempotent by email),
//   - clears only prior demo-host listings (FK cascades handle children),
//   - creates ~40 active + approved listings (so they show on the public page),
//   - gives a batch of them to the real owner account so they appear under
//     "My listings".
// Cities/neighborhoods are assumed to already exist (managed via the admin UI).
import bcrypt from "bcryptjs";
import prismaPkg from "@prisma/client";

const { PrismaClient } = prismaPkg;
const prisma = new PrismaClient();

// The real host account that should own a visible batch of listings.
const OWNER_EMAIL = "abbror2006@gmail.com";
const OWNER_BATCH = 10; // listings attributed to the owner (only if they have 0)
const DEMO_TOTAL = 40; // total listings created by this run

// Deterministic RNG so re-runs produce stable-looking data.
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

const CITY_DATA = {
  almaty: {
    districts: ["Медеуский", "Бостандыкский", "Алмалинский", "Ауэзовский", "Турксибский", "Жетысуский", "Наурызбайский", "Алатауский"],
    streets: ["проспект Аль-Фараби", "улица Сатпаева", "проспект Достык", "улица Тимирязева", "улица Жандосова", "улица Розыбакиева", "микрорайон Самал-2", "улица Толе би", "проспект Абая", "улица Гагарина"],
    universities: ["КазНУ им. аль-Фараби", "КБТУ", "AlmaU", "KIMEP", "СДУ", "Сатпаев Университет"],
    rent: [80000, 220000],
  },
  astana: {
    districts: ["Есильский", "Алматинский", "Сарыаркинский", "Байконурский", "Нура"],
    streets: ["проспект Кабанбай батыра", "улица Сыганак", "проспект Туран", "улица Достык", "проспект Мангилик Ел", "улица Кошкарбаева"],
    universities: ["Nazarbayev University", "ЕНУ им. Гумилёва", "Astana IT University", "КазАТУ им. Сейфуллина"],
    rent: [75000, 190000],
  },
  shymkent: {
    districts: ["Аль-Фарабийский", "Абайский", "Енбекшинский", "Каратауский", "Туран"],
    streets: ["проспект Тауке хана", "улица Байтурсынова", "проспект Республики", "улица Казыбек би", "улица Желтоксан"],
    universities: ["ЮКУ им. Ауэзова", "Университет Мирас"],
    rent: [55000, 120000],
  },
  karaganda: {
    districts: ["Казыбекбийский", "Октябрьский"],
    streets: ["проспект Бухар жырау", "улица Гоголя", "проспект Нуркена Абдирова", "улица Ермекова"],
    universities: ["КарУ им. Букетова", "Карагандинский медицинский университет"],
    rent: [55000, 110000],
  },
  pavlodar: {
    districts: ["Центральный", "Северный", "Усольский"],
    streets: ["улица Сатпаева", "улица Торайгырова", "улица Естая", "улица Академика Чокина"],
    universities: ["Торайгыров Университет", "ПГУ им. Торайгырова"],
    rent: [50000, 100000],
  },
};
const CITY_POOL = ["almaty", "almaty", "almaty", "almaty", "astana", "astana", "astana", "shymkent", "shymkent", "karaganda", "pavlodar"];
const CITY_LABEL_RU = { almaty: "Алматы", astana: "Астана", shymkent: "Шымкент", karaganda: "Караганда", pavlodar: "Павлодар" };

const PHOTO_IDS = [
  "photo-1522708323590-d24dbb6b0267", "photo-1502672260266-1c1ef2d93688",
  "photo-1505691938895-1758d7feb511", "photo-1493809842364-78817add7ffb",
  "photo-1567767292278-a4f21aa2d36e", "photo-1484154218962-a197022b5858",
  "photo-1493666438817-866a91353ca9", "photo-1560448204-e02f11c3d0e2",
  "photo-1554995207-c18c203602cb", "photo-1556912173-3bb406ef7e77",
  "photo-1540518614846-7eded433c457", "photo-1598928506311-c55ded91a20c",
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
  "Тишина после 23:00", "Уборка по графику", "Без шумных вечеринок",
  "Курение только на балконе", "Гости — по договорённости", "Без курения в квартире",
  "Раздельная оплата коммунальных", "Питомцы по согласованию",
];

const DEMO_HOSTS = [
  { fullName: "Арман Сериков", gender: "male" },
  { fullName: "Айгерим Калиева", gender: "female" },
  { fullName: "Дмитрий Ким", gender: "male" },
  { fullName: "Динара Оспанова", gender: "female" },
  { fullName: "Тимур Рахимов", gender: "male" },
  { fullName: "Сабина Мукановна", gender: "female" },
];

function buildListingData(hostId, index) {
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
  const monthlyRent = Math.round(randInt(rentMin, rentMax) / 1000) * 1000;
  const deposit = chance(0.8) ? Math.round((monthlyRent * (chance(0.5) ? 0.5 : 1)) / 1000) * 1000 : null;

  const availableFrom = new Date();
  availableFrom.setDate(availableFrom.getDate() + pick([0, 0, 7, 14, 30, 45]));

  return {
    hostId,
    title: pick(TITLE_TEMPLATES)({ rooms: totalRooms, uni, district, cityLabel }),
    description: `${pick(DESCRIPTIONS)} Рядом ${uni}.`,
    city,
    district,
    address: `${pick(meta.streets)}, дом ${randInt(1, 180)}`,
    monthlyRent,
    deposit,
    totalRooms,
    availableRooms,
    currentOccupants,
    maxOccupants,
    petsAllowed: chance(0.35),
    smokingAllowed: pick(["no", "no", "outside", "yes"]),
    genderPreference: pick(["any", "any", "male", "female"]),
    minAge: 18,
    maxAge: pick([28, 30, 35, 40]),
    furnished: chance(0.85),
    internetIncluded: chance(0.7),
    availableFrom,
    minStayMonths: pick([3, 6, 6, 12]),
    photos: pickN(PHOTO_IDS, 3).map(photoUrl),
    status: "active",
    isApproved: true,
  };
}

async function createListingWithChildren(hostId, index) {
  const listing = await prisma.listing.create({ data: buildListingData(hostId, index) });
  const bills = [
    { listingId: listing.id, category: "rent", label: "Базовая аренда", amountKzt: Number(listing.monthlyRent), isIncludedInRent: true },
    { listingId: listing.id, category: "utilities", label: "Коммунальные услуги", amountKzt: randInt(8, 25) * 1000, isIncludedInRent: chance(0.3) },
    { listingId: listing.id, category: "internet", label: "Интернет", amountKzt: randInt(5, 8) * 1000, isIncludedInRent: chance(0.5) },
  ];
  await prisma.bill.createMany({ data: bills });
  await prisma.houseRule.createMany({
    data: pickN(HOUSE_RULES, randInt(3, 4)).map((ruleText, idx) => ({ listingId: listing.id, ruleText, orderIndex: idx })),
  });
  return listing;
}

async function main() {
  const passwordHash = await bcrypt.hash("Roomie123!", 10);

  // --- demo hosts (idempotent by email) ---
  const demoHosts = [];
  let phoneSeq = 7020000100;
  for (let i = 0; i < DEMO_HOSTS.length; i += 1) {
    const email = `demo.host${i + 1}@roomie.kz`;
    const { fullName, gender } = DEMO_HOSTS[i];
    const host = await prisma.user.upsert({
      where: { email },
      update: { role: "host", fullName, isEmailVerified: true, isPhoneVerified: true },
      create: {
        email,
        passwordHash,
        fullName,
        phone: `+7${phoneSeq + i}`,
        role: "host",
        gender,
        occupation: pick(["IT-специалист", "Преподаватель", "Предприниматель", "Дизайнер", "Инженер"]),
        bio: "Сдаю комнату студентам. Рядом метро и университеты — всё для комфортной учёбы.",
        avatarUrl: `https://i.pravatar.cc/150?img=${randInt(1, 70)}`,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });
    demoHosts.push(host);
  }

  // --- clear ONLY prior demo-host listings (children cascade) ---
  const demoHostIds = demoHosts.map((h) => h.id);
  const cleared = await prisma.listing.deleteMany({ where: { hostId: { in: demoHostIds } } });

  // --- owner batch: only if the real owner currently has 0 listings ---
  const owner = await prisma.user.findUnique({ where: { email: OWNER_EMAIL } });
  let ownerCreated = 0;
  if (owner) {
    if (owner.role !== "host" && owner.role !== "admin" && owner.role !== "super_admin") {
      await prisma.user.update({ where: { id: owner.id }, data: { role: "host" } });
    }
    const ownerExisting = await prisma.listing.count({ where: { hostId: owner.id } });
    if (ownerExisting === 0) {
      for (let i = 0; i < OWNER_BATCH; i += 1) {
        await createListingWithChildren(owner.id, i);
        ownerCreated += 1;
      }
    }
  }

  // --- remaining listings spread across demo hosts ---
  const remaining = Math.max(0, DEMO_TOTAL - ownerCreated);
  for (let i = 0; i < remaining; i += 1) {
    const host = demoHosts[i % demoHosts.length];
    await createListingWithChildren(host.id, i);
  }

  const totalActive = await prisma.listing.count({ where: { status: "active", isApproved: true } });
  console.log("Top-up complete:");
  console.log(`- demo hosts: ${demoHosts.length} (demo.host1..${demoHosts.length}@roomie.kz / Roomie123!)`);
  console.log(`- cleared prior demo-host listings: ${cleared.count}`);
  console.log(`- owner (${OWNER_EMAIL}) listings created: ${ownerCreated}`);
  console.log(`- demo-host listings created: ${remaining}`);
  console.log(`- total active+approved listings now: ${totalActive}`);
}

main()
  .catch((error) => {
    console.error("Top-up seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
