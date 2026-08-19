import { sequelize } from '../db/database.js';

export const healthCheck = async (req, res) => {
  try {
    await sequelize.authenticate();

    return res.status(200).json({
      success: true,
      message: 'OK - Server and Database are awake',
    });
  } catch (error) {
    console.error('Database connection failed:', error);

    return res.status(500).json({
      success: false,
      message: 'DB offline',
    });
  }
};
