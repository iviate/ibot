
module.exports = (sequelize, Sequelize, DataTypes) => {
    const WalletTransfer = sequelize.define("wallet_transfer", {
      value: {
        type: DataTypes.FLOAT,
      },
      type: {
        type: DataTypes.INTEGER
      }
    });
  
    return WalletTransfer;
  };