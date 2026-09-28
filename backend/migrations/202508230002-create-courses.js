export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('courses', {
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
      code: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      semester: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Semester 1',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('active', 'completed'),
        allowNull: false,
        defaultValue: 'active',
      },
      credits: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      gradingPolicy: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      professorName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      professorReview: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      customNotes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
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

    await queryInterface.addIndex('courses', ['userId', 'code'], {
      unique: true,
      name: 'unique_user_course_code',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('courses');
  },
};
