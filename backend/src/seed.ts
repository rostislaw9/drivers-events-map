import * as dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI ?? "mongodb://localhost:27017/drivers_events";

const TOTAL_EVENTS = 10_000_000;
const BATCH_SIZE = 10_000;

const CITIES = [
  // --- Россия ---
  { name: "Moscow", lat: 55.7558, lng: 37.6173, radiusKm: 50, weight: 120 },
  {
    name: "Saint Petersburg",
    lat: 59.9343,
    lng: 30.3351,
    radiusKm: 35,
    weight: 55,
  },
  {
    name: "Yekaterinburg",
    lat: 56.8389,
    lng: 60.6057,
    radiusKm: 25,
    weight: 28,
  },
  { name: "Novosibirsk", lat: 55.0084, lng: 82.9357, radiusKm: 25, weight: 25 },
  { name: "Kazan", lat: 55.7963, lng: 49.1088, radiusKm: 20, weight: 20 },
  {
    name: "Nizhny Novgorod",
    lat: 56.3269,
    lng: 44.0065,
    radiusKm: 20,
    weight: 18,
  },
  { name: "Samara", lat: 53.1959, lng: 50.1008, radiusKm: 20, weight: 16 },
  { name: "Chelyabinsk", lat: 55.1644, lng: 61.4368, radiusKm: 20, weight: 14 },
  { name: "Omsk", lat: 54.9885, lng: 73.3242, radiusKm: 20, weight: 13 },
  {
    name: "Rostov-on-Don",
    lat: 47.2357,
    lng: 39.7015,
    radiusKm: 20,
    weight: 13,
  },
  { name: "Krasnodar", lat: 45.0355, lng: 38.9753, radiusKm: 20, weight: 12 },
  { name: "Ufa", lat: 54.7388, lng: 55.9721, radiusKm: 20, weight: 11 },
  {
    name: "Vladivostok",
    lat: 43.1332,
    lng: 131.9113,
    radiusKm: 20,
    weight: 10,
  },
  { name: "Khabarovsk", lat: 48.4827, lng: 135.084, radiusKm: 20, weight: 9 },
  { name: "Irkutsk", lat: 52.2978, lng: 104.2964, radiusKm: 20, weight: 9 },
  { name: "Krasnoyarsk", lat: 56.0153, lng: 92.8932, radiusKm: 20, weight: 10 },
  { name: "Perm", lat: 58.0092, lng: 56.2502, radiusKm: 20, weight: 10 },
  { name: "Volgograd", lat: 48.708, lng: 44.5133, radiusKm: 20, weight: 10 },
  // Антимеридиан — Чукотка (восточная сторона ~180°)
  { name: "Anadyr", lat: 64.7346, lng: 177.5141, radiusKm: 15, weight: 6 },
  { name: "Provideniya", lat: 64.3866, lng: -173.233, radiusKm: 10, weight: 5 },
  // --- Европа ---
  { name: "London", lat: 51.5074, lng: -0.1278, radiusKm: 40, weight: 35 },
  { name: "Paris", lat: 48.8566, lng: 2.3522, radiusKm: 35, weight: 32 },
  { name: "Berlin", lat: 52.52, lng: 13.405, radiusKm: 30, weight: 28 },
  { name: "Madrid", lat: 40.4168, lng: -3.7038, radiusKm: 30, weight: 22 },
  { name: "Rome", lat: 41.9028, lng: 12.4964, radiusKm: 30, weight: 20 },
  { name: "Warsaw", lat: 52.2297, lng: 21.0122, radiusKm: 25, weight: 16 },
  { name: "Kiev", lat: 50.4501, lng: 30.5234, radiusKm: 25, weight: 15 },
  { name: "Bucharest", lat: 44.4268, lng: 26.1025, radiusKm: 22, weight: 12 },
  // --- Азия ---
  { name: "Tokyo", lat: 35.6762, lng: 139.6503, radiusKm: 50, weight: 40 },
  { name: "Beijing", lat: 39.9042, lng: 116.4074, radiusKm: 45, weight: 36 },
  { name: "Shanghai", lat: 31.2304, lng: 121.4737, radiusKm: 40, weight: 34 },
  { name: "Seoul", lat: 37.5665, lng: 126.978, radiusKm: 35, weight: 28 },
  { name: "Mumbai", lat: 19.076, lng: 72.8777, radiusKm: 40, weight: 26 },
  { name: "Delhi", lat: 28.7041, lng: 77.1025, radiusKm: 40, weight: 28 },
  { name: "Bangkok", lat: 13.7563, lng: 100.5018, radiusKm: 30, weight: 20 },
  { name: "Singapore", lat: 1.3521, lng: 103.8198, radiusKm: 20, weight: 18 },
  { name: "Dubai", lat: 25.2048, lng: 55.2708, radiusKm: 25, weight: 18 },
  { name: "Istanbul", lat: 41.0082, lng: 28.9784, radiusKm: 35, weight: 22 },
  { name: "Almaty", lat: 43.222, lng: 76.8512, radiusKm: 20, weight: 10 },
  { name: "Tashkent", lat: 41.2995, lng: 69.2401, radiusKm: 20, weight: 10 },
  // --- Северная Америка ---
  { name: "New York", lat: 40.7128, lng: -74.006, radiusKm: 50, weight: 38 },
  {
    name: "Los Angeles",
    lat: 34.0522,
    lng: -118.2437,
    radiusKm: 45,
    weight: 32,
  },
  { name: "Chicago", lat: 41.8781, lng: -87.6298, radiusKm: 35, weight: 24 },
  { name: "Toronto", lat: 43.6532, lng: -79.3832, radiusKm: 30, weight: 18 },
  {
    name: "Mexico City",
    lat: 19.4326,
    lng: -99.1332,
    radiusKm: 40,
    weight: 20,
  },
  { name: "Anchorage", lat: 61.2181, lng: -149.9003, radiusKm: 20, weight: 6 },
  // Антимеридиан — Аляска/Алеуты (западная сторона ~-180°)
  { name: "Adak", lat: 51.88, lng: -176.6581, radiusKm: 8, weight: 4 },
  { name: "Attu", lat: 52.9, lng: 173.18, radiusKm: 8, weight: 4 },
  // --- Южная Америка ---
  { name: "Sao Paulo", lat: -23.5505, lng: -46.6333, radiusKm: 50, weight: 24 },
  {
    name: "Buenos Aires",
    lat: -34.6037,
    lng: -58.3816,
    radiusKm: 40,
    weight: 18,
  },
  { name: "Bogota", lat: 4.711, lng: -74.0721, radiusKm: 30, weight: 14 },
  // --- Африка ---
  { name: "Cairo", lat: 30.0444, lng: 31.2357, radiusKm: 40, weight: 18 },
  { name: "Lagos", lat: 6.5244, lng: 3.3792, radiusKm: 35, weight: 14 },
  {
    name: "Johannesburg",
    lat: -26.2041,
    lng: 28.0473,
    radiusKm: 30,
    weight: 12,
  },
  { name: "Nairobi", lat: -1.2921, lng: 36.8219, radiusKm: 25, weight: 10 },
  // --- Австралия ---
  { name: "Sydney", lat: -33.8688, lng: 151.2093, radiusKm: 35, weight: 18 },
  { name: "Melbourne", lat: -37.8136, lng: 144.9631, radiusKm: 30, weight: 15 },
  // --- Полярные точки (граничные случаи) ---
  { name: "Murmansk", lat: 68.9585, lng: 33.0827, radiusKm: 15, weight: 6 },
  { name: "Tromsø", lat: 69.6492, lng: 18.9553, radiusKm: 12, weight: 5 },
  { name: "Longyearbyen", lat: 78.2232, lng: 15.6267, radiusKm: 8, weight: 4 },
  { name: "Yakutsk", lat: 62.0355, lng: 129.6755, radiusKm: 15, weight: 7 },
  { name: "Magadan", lat: 59.5613, lng: 150.7983, radiusKm: 12, weight: 5 },
  { name: "Ushuaia", lat: -54.8019, lng: -68.303, radiusKm: 8, weight: 4 },
];

const TOTAL_WEIGHT = CITIES.reduce((sum, city) => sum + city.weight, 0);

const UNIQUE_OBJECTS = 200_000;

// ~10% событий — равномерный фон по всей Земле для покрытия океанов и малонаселённых регионов
const BACKGROUND_RATIO = 0.1;

function randomGlobalPoint(): { lat: number; lng: number } {
  // Равномерное распределение по сфере
  const lng = Math.random() * 360 - 180;
  const lat = (Math.asin(Math.random() * 2 - 1) * 180) / Math.PI;
  return { lat, lng };
}

function randomSpeed(): number {
  return Math.round((40 + Math.random() * 90) * 10) / 10;
}

function randomDate(daysAgo: number): Date {
  const now = Date.now();

  return new Date(now - Math.random() * daysAgo * 24 * 60 * 60 * 1000);
}

function randomCity() {
  const value = Math.random() * TOTAL_WEIGHT;

  let cumulative = 0;

  for (const city of CITIES) {
    cumulative += city.weight;

    if (value <= cumulative) {
      return city;
    }
  }

  return CITIES[0];
}

function randomPointNearCity(city: (typeof CITIES)[number]) {
  const radiusDeg = city.radiusKm / 111;

  const angle = Math.random() * Math.PI * 2;

  const distance = Math.sqrt(Math.random()) * radiusDeg;

  const lat = city.lat + Math.cos(angle) * distance;

  const lng =
    city.lng +
    (Math.sin(angle) * distance) / Math.cos((city.lat * Math.PI) / 180);

  return { lat, lng };
}

const eventSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    createdAt: {
      type: Date,
      required: true,
    },
    lat: Number,
    lng: Number,
    oid: Number,
    sp: Number,
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
  },
  {
    collection: "events",
  },
);

eventSchema.index({ location: "2dsphere" });
eventSchema.index({ createdAt: -1 });
eventSchema.index({ id: 1 }, { unique: true });

async function seed() {
  await mongoose.connect(MONGODB_URI);

  console.log(`Connected to ${MONGODB_URI}`);

  const EventModel = mongoose.model("Event", eventSchema);

  console.log("Removing existing documents...");

  await EventModel.deleteMany({});

  let inserted = 0;

  while (inserted < TOTAL_EVENTS) {
    const batchCount = Math.min(BATCH_SIZE, TOTAL_EVENTS - inserted);

    const batch = [];

    for (let i = 0; i < batchCount; i++) {
      const isBackground = Math.random() < BACKGROUND_RATIO;
      const { lat, lng } = isBackground
        ? randomGlobalPoint()
        : randomPointNearCity(randomCity());

      batch.push({
        id: inserted + i + 1,

        createdAt: randomDate(30),

        lat,
        lng,

        oid: 1 + Math.floor(Math.random() * UNIQUE_OBJECTS),

        sp: randomSpeed(),

        location: {
          type: "Point",
          coordinates: [lng, lat],
        },
      });
    }

    await EventModel.insertMany(batch, {
      ordered: false,
    });

    inserted += batchCount;

    console.log(
      `${inserted.toLocaleString()} / ${TOTAL_EVENTS.toLocaleString()}`,
    );
  }

  const counterSchema = new mongoose.Schema(
    {
      _id: String,
      seq: Number,
    },
    {
      collection: "counters",
    },
  );

  const CounterModel = mongoose.model("Counter", counterSchema);

  await CounterModel.findOneAndUpdate(
    {
      _id: "events",
    },
    {
      $set: {
        seq: TOTAL_EVENTS,
      },
    },
    {
      upsert: true,
    },
  );

  console.log("Seed completed");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
