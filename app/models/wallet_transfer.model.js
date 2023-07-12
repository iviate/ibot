
module.exports = (sequelize, Sequelize, DataTypes) => {
    const WalletTransfer = sequelize.define("wallet_transfer", {
      amount: {
        type: DataTypes.FLOAT,
      }
    });
  
    return WalletTransfer;
  };