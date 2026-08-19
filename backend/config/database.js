import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize(process.env,AIVEN_CONNECTION, {
  dialect: 'mysql',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});