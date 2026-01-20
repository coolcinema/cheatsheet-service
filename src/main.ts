import Fastify from "fastify";
import view from "@fastify/view";
import ejs from "ejs";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { glob } from "glob";

const server = Fastify({ logger: true });

// Определяем корень (в проде мы в dist, в деве в src)
const isProd = __dirname.endsWith("dist");
const rootDir = isProd ? __dirname : path.join(__dirname, "..");

// Подключаем шаблонизатор
server.register(view, {
  engine: { ejs },
  root: path.join(rootDir, "views"),
});

// Интерфейс данных
interface CheatSheet {
  title: string;
  category: string;
  description: string;
  docUrl?: string;
  commands: {
    signature: string;
    description: string;
    arguments?: { name: string; description: string }[];
    example?: string;
  }[];
}

// Загрузка данных
const loadData = async (): Promise<CheatSheet[]> => {
  const files = await glob(path.join(rootDir, "data/*.yaml"));
  return files.map((file) => {
    const content = fs.readFileSync(file, "utf8");
    return yaml.load(content) as CheatSheet;
  });
};

// Роут
server.get("/", async (req, reply) => {
  const sheets = await loadData();
  // Группировка по категориям
  const categories = sheets.reduce(
    (acc, sheet) => {
      if (!acc[sheet.category]) acc[sheet.category] = [];
      acc[sheet.category].push(sheet);
      return acc;
    },
    {} as Record<string, CheatSheet[]>,
  );

  return reply.view("index.ejs", { categories });
});

const start = async () => {
  try {
    // Порт 5000 - стандарт для наших микросервисов
    await server.listen({ port: 5000, host: "0.0.0.0" });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
