
module.exports = (sequelize, Sequelize, DataTypes) => {
    const Martingel = sequelize.define("martingel", {
      name: {
          type: DataTypes.STRING
      },
      data: {
        type: DataTypes.TEXT,
        defaultValue: '[]'
      }
    });

    Martingel.associate = function(models) {
        Martingel.belongsTo(User, {foreignKey: 'user_id', as: 'user'})
      };
    
  
    return Martingel;
  };