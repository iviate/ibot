
module.exports = (sequelize, Sequelize, DataTypes) => {
    const SpecialUser = sequelize.define("special_user", {
      username: {
        type: DataTypes.STRING
      },
    });
  
    return SpecialUser;
  };