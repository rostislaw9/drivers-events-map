import * as dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI ?? "mongodb://localhost:27017/drivers_events";

// 30 уникальных объектов (oid 1-30) с фиксированными координатами в пределах Москвы
const OID_LOCATIONS_MSK: Record<number, { lat: number; lng: number }> = {
  1: { lat: 55.7558, lng: 37.6173 },
  2: { lat: 55.7651, lng: 37.598 },
  3: { lat: 55.7425, lng: 37.631 },
  4: { lat: 55.78, lng: 37.645 },
  5: { lat: 55.73, lng: 37.58 },
  6: { lat: 55.79, lng: 37.56 },
  7: { lat: 55.71, lng: 37.67 },
  8: { lat: 55.8, lng: 37.7 },
  9: { lat: 55.72, lng: 37.54 },
  10: { lat: 55.77, lng: 37.72 },
  11: { lat: 55.748, lng: 37.685 },
  12: { lat: 55.762, lng: 37.573 },
  13: { lat: 55.735, lng: 37.71 },
  14: { lat: 55.81, lng: 37.66 },
  15: { lat: 55.705, lng: 37.62 },
  16: { lat: 55.795, lng: 37.53 },
  17: { lat: 55.718, lng: 37.74 },
  18: { lat: 55.783, lng: 37.69 },
  19: { lat: 55.738, lng: 37.555 },
  20: { lat: 55.758, lng: 37.75 },
  21: { lat: 55.726, lng: 37.605 },
  22: { lat: 55.772, lng: 37.625 },
  23: { lat: 55.746, lng: 37.59 },
  24: { lat: 55.805, lng: 37.58 },
  25: { lat: 55.714, lng: 37.655 },
  26: { lat: 55.787, lng: 37.735 },
  27: { lat: 55.732, lng: 37.765 },
  28: { lat: 55.768, lng: 37.545 },
  29: { lat: 55.753, lng: 37.642 },
  30: { lat: 55.799, lng: 37.61 },
};

// 30 уникальных объектов (oid 31-60) с фиксированными координатами в пределах Санкт-Петербурга
const OID_LOCATIONS_SPB: Record<number, { lat: number; lng: number }> = {
  31: { lat: 59.9343, lng: 30.3351 },
  32: { lat: 59.95, lng: 30.317 },
  33: { lat: 59.92, lng: 30.36 },
  34: { lat: 59.965, lng: 30.38 },
  35: { lat: 59.91, lng: 30.29 },
  36: { lat: 59.978, lng: 30.26 },
  37: { lat: 59.9, lng: 30.42 },
  38: { lat: 59.987, lng: 30.45 },
  39: { lat: 59.905, lng: 30.24 },
  40: { lat: 59.96, lng: 30.47 },
  41: { lat: 59.938, lng: 30.435 },
  42: { lat: 59.952, lng: 30.298 },
  43: { lat: 59.915, lng: 30.46 },
  44: { lat: 59.992, lng: 30.4 },
  45: { lat: 59.898, lng: 30.37 },
  46: { lat: 59.975, lng: 30.22 },
  47: { lat: 59.907, lng: 30.49 },
  48: { lat: 59.982, lng: 30.44 },
  49: { lat: 59.923, lng: 30.255 },
  50: { lat: 59.948, lng: 30.5 },
  51: { lat: 59.916, lng: 30.355 },
  52: { lat: 59.962, lng: 30.375 },
  53: { lat: 59.936, lng: 30.285 },
  54: { lat: 59.995, lng: 30.28 },
  55: { lat: 59.894, lng: 30.405 },
  56: { lat: 59.977, lng: 30.485 },
  57: { lat: 59.912, lng: 30.515 },
  58: { lat: 59.958, lng: 30.235 },
  59: { lat: 59.942, lng: 30.392 },
  60: { lat: 59.989, lng: 30.36 },
};

const OID_COUNT_MSK = Object.keys(OID_LOCATIONS_MSK).length;
const OID_COUNT_SPB = Object.keys(OID_LOCATIONS_SPB).length;
const EVENTS_PER_CITY = 150;

function randomSpeed(): number {
  return Math.round((60 + Math.random() * 60) * 10) / 10;
}

function randomDate(daysAgo: number): Date {
  const now = Date.now();
  const offset = Math.random() * daysAgo * 24 * 60 * 60 * 1000;
  return new Date(now - offset);
}

const eventSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    createdAt: { type: Date, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    oid: { type: Number, required: true },
    sp: { type: Number, required: true },
    location: {
      type: { type: String, enum: ["Point"], required: true },
      coordinates: { type: [Number], required: true },
    },
  },
  { collection: "events" },
);

eventSchema.index({ location: "2dsphere" });
eventSchema.index({ createdAt: -1 });
eventSchema.index({ id: 1 }, { unique: true });

async function seed(): Promise<void> {
  await mongoose.connect(MONGODB_URI);
  console.log(`Connected to MongoDB: ${MONGODB_URI}`);

  const EventModel = mongoose.model("Event", eventSchema);

  const existing = await EventModel.countDocuments();
  if (existing > 0) {
    console.log(`Collection already has ${existing} events. Dropping...`);
    await EventModel.deleteMany({});
  }

  const mskEvents = Array.from({ length: EVENTS_PER_CITY }, (_, i) => {
    const id = i + 1;
    const oid = (i % OID_COUNT_MSK) + 1;
    const { lat, lng } = OID_LOCATIONS_MSK[oid];
    return {
      id,
      createdAt: randomDate(30),
      lat,
      lng,
      oid,
      sp: randomSpeed(),
      location: { type: "Point", coordinates: [lng, lat] },
    };
  });

  const spbEvents = Array.from({ length: EVENTS_PER_CITY }, (_, i) => {
    const id = EVENTS_PER_CITY + i + 1;
    const oid = (i % OID_COUNT_SPB) + 31;
    const { lat, lng } = OID_LOCATIONS_SPB[oid];
    return {
      id,
      createdAt: randomDate(30),
      lat,
      lng,
      oid,
      sp: randomSpeed(),
      location: { type: "Point", coordinates: [lng, lat] },
    };
  });

  const allEvents = [...mskEvents, ...spbEvents];
  await EventModel.insertMany(allEvents, { ordered: false });
  console.log(
    `Seeded ${EVENTS_PER_CITY * 2} events successfully (${EVENTS_PER_CITY} Moscow + ${EVENTS_PER_CITY} St. Petersburg).`,
  );

  // Сбрасываем счётчик чтобы getNextSequence продолжал с максимального id
  const maxId = Math.max(...allEvents.map((e) => e.id));
  const counterSchema = new mongoose.Schema(
    { _id: String, seq: { type: Number, default: 0 } },
    { collection: "counters" },
  );
  const CounterModel = mongoose.model("Counter", counterSchema);
  await CounterModel.findOneAndUpdate(
    { _id: "events" },
    { $set: { seq: maxId } },
    { upsert: true },
  );
  console.log(`Counter reset to ${maxId}.`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
