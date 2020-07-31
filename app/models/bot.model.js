
module.exports = (sequelize, Sequelize, DataTypes) => {
    const Bot = sequelize.define("bot", {
      token: {
          type: DataTypes.STRING
      },
      token_at: {
           type: DataTypes.DATE,
      },
      status: {
        type: DataTypes.INTEGER // 1 open, 2 pasuse, 3 closed
      },
      money_system: {
        type: DataTypes.INTEGER // 1 stable, 2 ไนติงเกล, 3 ลาบูแชร์
      },
      profit_threshold: {
        type: DataTypes.FLOAT.UNSIGNED,
      },
      loss_threshold:{
        type: DataTypes.FLOAT.UNSIGNED,
      },
      init_wallet: {
        type: DataTypes.FLOAT.UNSIGNED,
      },
      init_bet: {
        type: DataTypes.FLOAT.UNSIGNED,
      },
      bet_side: {
        type: DataTypes.INTEGER, // 1 P/B , 2 ONLY B, 3 ONLY P
      },
      max_turn: {
        type: DataTypes.INTEGER.UNSIGNED,
      },
      stats: {
        type: DataTypes.TEXT,
        default: '[]'
      },
      data: {
        type: DataTypes.TEXT,
        default: '{}'
      },
      stop_by: {
        type: DataTypes.INTEGER, // 1 user, 2 profit stop, 3 loss stop, 4 error
        allowNull: true
      },
      stop_wallet: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      closed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
    });

    Bot.associate = function(models) {
        Order.belongsTo(models.Area, {foreignKey: 'areaId', as: 'area'});
        Bot.belongsTo(User, {foreignKey: 'user_id', as: 'user'})
      };
    
  
    return Bot;
  };