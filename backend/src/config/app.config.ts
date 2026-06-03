import { registerAs } from "@nestjs/config";

// Настройки приложения, доступны через ConfigService по ключу "app"
export default registerAs("app", () => ({
  port: parseInt(process.env.PORT ?? "3001", 10),
  mongoUri:
    process.env.MONGODB_URI ?? "mongodb://localhost:27017/drivers-events-map",
}));
