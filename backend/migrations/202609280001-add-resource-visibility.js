export default {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('resources');
    if (!columns.isPublic) {
      await queryInterface.addColumn('resources', 'isPublic', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  async down(queryInterface) {
    const columns = await queryInterface.describeTable('resources');
    if (columns.isPublic) {
      await queryInterface.removeColumn('resources', 'isPublic');
    }
  },
};
