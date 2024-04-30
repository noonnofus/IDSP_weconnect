import mysql from 'mysql2/promise';
import { Pool } from 'mysql2/promise';

const isQoddi: boolean = process.env.IS_QODDI === 'true';

interface DbConfig {
	host: string;
	user: string;
	password: string;
	database: string;
	multipleStatements: boolean;
	reconnect: boolean;
	namedPlaceholders: boolean;
}

// 배포 서버 디비 설정
const dbConfigQoddi: DbConfig = {
	host: "sql.freedb.tech",
	user: "freedb_2350_main_Jin",
	password: "$Bq9CP4C8e8aAWh",
	database: "freedb_comp2350-week2-A01292717",
	multipleStatements: false,
	reconnect: true,
	namedPlaceholders: true
};

// 로컬 데이터베이스 설정
const dbConfigLocal: DbConfig = {
	host: "sql.freedb.tech",
	user: "freedb_2350_main_Jin",
	password: "$Bq9CP4C8e8aAWh",
	database: "freedb_comp2350-week2-A01292717",
	multipleStatements: false,
	reconnect: true,
	namedPlaceholders: true
};

// 데이터베이스 풀 생성
const database: Pool = mysql.createPool(isQoddi ? dbConfigQoddi : dbConfigLocal);

export default database;
