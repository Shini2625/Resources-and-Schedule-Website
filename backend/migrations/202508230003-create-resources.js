export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('resources', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      category: {
        type: Sequelize.ENUM(
          'notes',
          'references',
          'tutorials',
          'solutions',
          'pyqs',
          'grading',
          'custom'
        ),
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('file', 'link', 'text'),
        allowNull: false,
        defaultValue: 'file',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      fileUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      externalLink: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      courseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'courses',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('resources');
  },
};
