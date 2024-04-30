const mysql = require('mysql2/promise');

const is_qoddi = process.env.IS_QODDI || false;

const dbConfigQoddi = {
	host: "sql.freedb.tech",
	user: "freedb_2350_main_Jin",
	password: "$Bq9CP4C8e8aAWh",
	database: "freedb_comp2350-week2-A01292717",
	multipleStatements: false,
	reconnect: true,
	namedPlaceholders: true
};

const dbConfigLocal = {
	host: "sql.freedb.tech",
	user: "freedb_2350_main_Jin",
	password: "$Bq9CP4C8e8aAWh",
	database: "freedb_comp2350-week2-A01292717",
	multipleStatements: false,
	reconnect: true,
	namedPlaceholders: true
};

if (is_qoddi) {
	var database = mysql.createPool(dbConfigQoddi);
}
else {
	var database = mysql.createPool(dbConfigLocal);
}

module.exports = database;
		