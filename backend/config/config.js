import dotenv from "dotenv";
dotenv.config();

// Helper function to check if SSL should be disabled (for local dev)
const isLocalDB = (host) => {
  return host === 'localhost' || host === '127.0.0.1' || host === 'host.docker.internal' || host === 'postgres' || host === 'db';
};

const config = {
  development: {
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'pawshub_dev',
    host: process.env.DB_HOST || 'db',
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    dialectOptions: isLocalDB(process.env.DB_HOST || 'db') ? {} : {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    define: {
      schema: process.env.DB_SCHEMA || 'public',
    },
  },
  test: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    dialectOptions: isLocalDB(process.env.DB_HOST || 'db') ? {} : {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    define: {
      schema: process.env.DB_SCHEMA,
    },
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    dialectOptions: isLocalDB(process.env.DB_HOST || 'db') ? {} : {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    define: {
      schema: process.env.DB_SCHEMA,
    },
  },
};

export default config;
