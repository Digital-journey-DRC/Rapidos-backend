const { Client } = require('pg');

const client = new Client({
  host: 'db-rapidos-do-user-22329201-0.e.db.ondigitalocean.com',
  port: 25060,
  user: 'doadmin',
  password: 'AVNS_RMJIxzQS_DOFSdl1K3s',
  database: 'defaultdb',
  ssl: {
    rejectUnauthorized: false
  }
});

async function addColumn() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    await client.query(`
      ALTER TABLE promotions 
      ADD COLUMN IF NOT EXISTS date_debut_promotion TIMESTAMP WITH TIME ZONE NULL
    `);
    
    console.log('Column date_debut_promotion added successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

addColumn();
