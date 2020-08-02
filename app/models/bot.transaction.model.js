module.exports = (sequelize, Sequelize, DataTypes) => {
    const BotTransaction = sequelize.define("bot_transaction", {
        bot_type:{
            type: DataTypes.INTEGER // 1: iBotX, 2 3 cut, 3 4 cut
        },
        table_id: {
            type: DataTypes.INTEGER
        },
        table_title: {
            type: DataTypes.STRING
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
        },
        point: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    });

    return BotTransaction;
};