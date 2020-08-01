
module.exports = (sequelize, Sequelize, DataTypes) => {
    const UserTransaction = sequelize.define("user_transaction", {
      value: {
          type: DataTypes.FLOAT
      },
      wallet: {
          type: DataTypes.FLOAT 
      }
    })
    return UserTransaction;
  };