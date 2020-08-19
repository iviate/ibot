
module.exports = (sequelize, Sequelize, DataTypes) => {
    const UserTransaction = sequelize.define("user_transaction", {
      value: {
          type: DataTypes.FLOAT
      },
      wallet: {
          type: DataTypes.FLOAT 
      },
      user_bet:{
          type: DataTypes.STRING
      },
      result:{
        type: DataTypes.STRING
      }
    })
    return UserTransaction;
  };