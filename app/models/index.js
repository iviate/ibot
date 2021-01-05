const dbConfig = require("../../config/db.config.js");

const Sequelize = require("sequelize");
const { DataTypes } = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: false,
  logging: false
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require("./user.model.js")(sequelize, Sequelize, DataTypes);
db.bot = require("./bot.model.js")(sequelize, Sequelize, DataTypes);
db.botTransction = require("./bot.transaction.model.js")(sequelize, Sequelize, DataTypes);
db.userTransaction = require("./user_transaction.model.js")(sequelize, Sequelize, DataTypes);
db.wallet_transfer = require("./wallet_transfer.model.js")(sequelize, Sequelize, DataTypes);
db.member = require("./member.model.js")(sequelize, Sequelize, DataTypes)
db.member_record = require("./member_record.model.js")(sequelize, Sequelize, DataTypes)
db.agent_record = require("./agent_record.model.js")(sequelize, Sequelize, DataTypes)
db.rolling = require("./rolling.model")(sequelize, Sequelize, DataTypes)
db.rolling_withdraw = require("./rolling_withdraw.model")(sequelize, Sequelize, DataTypes)
db.mockUserTransaction = require("./mock_user_transaction.model")(sequelize, Sequelize, DataTypes)

db.user.hasMany(db.bot, { as: "bots" });
db.bot.belongsTo(db.user, {
  foreignKey: "userId",
  as: "user",
});

db.bot.hasMany(db.userTransaction, { as: "transactions" });
db.userTransaction.belongsTo(db.bot, {
  foreignKey: "botId",
  as: "bot",
});

db.botTransction.hasMany(db.userTransaction, { as: "users" });
db.userTransaction.belongsTo(db.botTransction, {
  foreignKey: "botTransactionId",
  as: "bot_transaction",
});

db.bot.hasMany(db.wallet_transfer, {as: "profit_transfer"});
db.wallet_transfer.belongsTo(db.bot, {
  foreignKey: "botId",
  as: "bot"
})







module.exports = db;