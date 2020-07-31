module.exports = (sequelize, Sequelize, DataTypes) => {
    const BotTransaction = sequelize.define("bot_transaction", {
        table_id: {
            type: DataTypes.INTEGER
        },
        table_title: {
            type: DataTypes.INTEGER
        },
        game_id: {
            type: DataTypes.STRING,
        },
        shoe: {
            type: DataTypes.STRING
        },
        round: {
            type: DataTypes.INTEGER
        },
        bet: {
            type: DataTypes.STRING,
        },
        result: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        win_result: {
            type: DataTypes.STRING,
            allowNull: true
        },
        user_count: {
            type: DataTypes.INTEGER
        }
    });

    Bot.associate = function (models) {
        Order.belongsTo(models.Area, {
            foreignKey: 'areaId',
            as: 'area'
        });
        Bot.belongsTo(User, {
            foreignKey: 'user_id',
            as: 'user'
        })
    };

    return BotTransaction;
};