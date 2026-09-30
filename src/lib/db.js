import sql from "mssql";

const config = {
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,

  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

let pool;

export async function getDb() {
  if (!pool) {
    pool = await sql.connect(config);
  }

  return pool;
}