const dbConfig = require("../../config/db.config.js");

const Sequelize = require("sequelize");
const { DataTypes } = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: false,
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require("./user.model.js")(sequelize, Sequelize, DataTypes);
db.bot = require("./bot.model.js")(sequelize, Sequelize, DataTypes);
db.botTransction = require("./bot.transaction.model.js")(sequelize, Sequelize, DataTypes);
db.userTransaction = require("./user_transaction.model.js")(sequelize, Sequelize, DataTypes);

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



module.exports = db;