import { sequelize } from '../config/database.js';

export const healthCtrl = async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).send('OK - Server and Database are awake');
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).send('DB offline');
  }
};