import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export class Store {
  constructor(path){
    if(path!==':memory:') mkdirSync(dirname(path),{recursive:true,mode:0o700});
    this.db=new DatabaseSync(path);this.path=path;
    this.db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS orders(
        id TEXT PRIMARY KEY, buyer TEXT NOT NULL, chat TEXT NOT NULL, mode TEXT NOT NULL,
        product TEXT NOT NULL, player_id TEXT NOT NULL, nickname TEXT NOT NULL,
        price INTEGER NOT NULL CHECK(price>0),sender_hash TEXT,sender_box TEXT,
        state TEXT NOT NULL, created INTEGER NOT NULL,expires INTEGER NOT NULL,
        code_id TEXT,receipt TEXT, error TEXT, payment_reference TEXT
      );
      CREATE TABLE IF NOT EXISTS stock(
        id TEXT PRIMARY KEY,mode TEXT NOT NULL,product TEXT NOT NULL,fingerprint TEXT NOT NULL,
        box TEXT NOT NULL,cost INTEGER NOT NULL CHECK(cost>=0),state TEXT NOT NULL,
        reserved_order TEXT UNIQUE, reserved_until INTEGER, UNIQUE(mode,fingerprint)
      );
      CREATE INDEX IF NOT EXISTS stock_available ON stock(mode,product,state);
      CREATE TABLE IF NOT EXISTS payments(
        id TEXT PRIMARY KEY,mode TEXT NOT NULL,reference TEXT NOT NULL,amount INTEGER NOT NULL,
        sender_hash TEXT NOT NULL, occurred INTEGER NOT NULL,source TEXT NOT NULL,
        trusted INTEGER NOT NULL DEFAULT 0, order_id TEXT, UNIQUE(mode,reference)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS one_payment_per_order ON payments(order_id) WHERE trusted=1;
      CREATE TABLE IF NOT EXISTS jobs(
        id TEXT PRIMARY KEY,order_id TEXT NOT NULL UNIQUE,code_id TEXT NOT NULL,
        state TEXT NOT NULL,started INTEGER,updated INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS audit(
        id INTEGER PRIMARY KEY,at INTEGER NOT NULL,actor TEXT NOT NULL,action TEXT NOT NULL,
        entity TEXT NOT NULL,detail TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS nonces(namespace TEXT NOT NULL,nonce TEXT NOT NULL,expires INTEGER NOT NULL,PRIMARY KEY(namespace,nonce));
      CREATE TABLE IF NOT EXISTS sms_events(id TEXT PRIMARY KEY,reference TEXT UNIQUE,at INTEGER NOT NULL,result TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions(user TEXT PRIMARY KEY,box TEXT NOT NULL,updated INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS inbox(id TEXT PRIMARY KEY,box TEXT NOT NULL,state TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,updated INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS outbox(id TEXT PRIMARY KEY,chat TEXT NOT NULL,payload TEXT NOT NULL,state TEXT NOT NULL,updated INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0);
    `);
  }
  get(sql,...args){return this.db.prepare(sql).get(...args);}
  all(sql,...args){return this.db.prepare(sql).all(...args);}
  run(sql,...args){return this.db.prepare(sql).run(...args);}
  tx(fn){
    this.db.exec('BEGIN IMMEDIATE');
    try{const value=fn();this.db.exec('COMMIT');return value;}
    catch(error){this.db.exec('ROLLBACK');throw error;}
  }
  setting(key,fallback=null){const row=this.get('SELECT value FROM settings WHERE key=?',key);return row?JSON.parse(row.value):fallback;}
  set(key,value){this.run('INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',key,JSON.stringify(value));}
  close(){if(!this.closed){this.db.close();this.closed=true;}}
}
