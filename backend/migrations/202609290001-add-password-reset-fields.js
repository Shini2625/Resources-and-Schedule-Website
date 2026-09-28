export default {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('users');
    if (!columns.passwordResetTokenHash) {
      await queryInterface.addColumn('users', 'passwordResetTokenHash', {
        type: Sequelize.STRING(64),
        allowNull: true,
      });
    }
    if (!columns.passwordResetExpiresAt) {
      await queryInterface.addColumn('users', 'passwordResetExpiresAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
    if (!columns.tokenVersion) {
      await queryInterface.addColumn('users', 'tokenVersion', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }
  },

  async down(queryInterface) {
    const columns = await queryInterface.describeTable('users');
    if (columns.tokenVersion) await queryInterface.removeColumn('users', 'tokenVersion');
    if (columns.passwordResetExpiresAt) await queryInterface.removeColumn('users', 'passwordResetExpiresAt');
    if (columns.passwordResetTokenHash) await queryInterface.removeColumn('users', 'passwordResetTokenHash');
  },
};
