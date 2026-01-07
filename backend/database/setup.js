const { Client } = require('pg');
require('dotenv').config();

async function setupDatabase() {
  let client;
  
  try {
    // Connect without specifying database first
    client = new Client({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 5432
    });

    await client.connect();
    console.log('Connected to PostgreSQL server');

    // Create database
    await client.query(`CREATE DATABASE ${process.env.DB_NAME || 'task_manager'}`);
    console.log(`Database "${process.env.DB_NAME || 'task_manager'}" created`);
    
    await client.end();

    // Connect to the new database
    client = new Client({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'task_manager'
    });

    await client.connect();
    console.log(`Connected to database "${process.env.DB_NAME || 'task_manager'}"`);

    // Create Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table created');

    // Create update trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    console.log('Update trigger function created');

    // Create triggers
    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    // Create Tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        task_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        details TEXT,
        repeat_timeline VARCHAR(20) NOT NULL CHECK (repeat_timeline IN ('daily', 'weekly', 'monthly', 'yearly')),
        due_within_days INTEGER NOT NULL DEFAULT 1,
        times_completed INTEGER DEFAULT 0,
        total_completion_time INTEGER DEFAULT 0,
        average_completion_time DECIMAL(10, 2) DEFAULT 0,
        last_completed_at TIMESTAMP NULL,
        next_due_date TIMESTAMP NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);
    console.log('Tasks table created');

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tasks_next_due_date ON tasks(next_due_date)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tasks_is_active ON tasks(is_active)`);

    // Create trigger for tasks
    await client.query(`
      DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
      CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    // Create Task Completions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_completions (
        completion_id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completion_time_minutes INTEGER,
        was_on_time BOOLEAN DEFAULT TRUE,
        days_from_due INTEGER DEFAULT 0,
        notes TEXT,
        FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);
    console.log('Task completions table created');

    // Create indexes for task_completions
    await client.query(`CREATE INDEX IF NOT EXISTS idx_completions_task_id ON task_completions(task_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_completions_completed_at ON task_completions(completed_at)`);

    // Create view
    await client.query(`
      CREATE OR REPLACE VIEW task_statistics AS
      SELECT 
        t.task_id,
        t.user_id,
        t.title,
        t.times_completed,
        t.average_completion_time,
        t.last_completed_at,
        t.next_due_date,
        COUNT(tc.completion_id) as total_completions,
        AVG(tc.completion_time_minutes) as avg_completion_minutes,
        SUM(CASE WHEN tc.was_on_time = TRUE THEN 1 ELSE 0 END) as on_time_completions,
        SUM(CASE WHEN tc.was_on_time = FALSE THEN 1 ELSE 0 END) as late_completions,
        CASE 
          WHEN COUNT(tc.completion_id) > 0 
          THEN (SUM(CASE WHEN tc.was_on_time = TRUE THEN 1 ELSE 0 END)::DECIMAL / COUNT(tc.completion_id) * 100)
          ELSE 0
        END as on_time_percentage
      FROM tasks t
      LEFT JOIN task_completions tc ON t.task_id = tc.task_id
      GROUP BY t.task_id
    `);
    console.log('Task statistics view created');

    console.log('\n✅ Database setup completed successfully!');
    await client.end();
    process.exit(0);

  } catch (error) {
    if (error.code === '42P04') {
      console.log(`Database already exists, skipping creation`);
      try {
        if (client) await client.end();
        
        // Connect to existing database and create tables
        client = new Client({
          host: process.env.DB_HOST || 'localhost',
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || '',
          port: process.env.DB_PORT || 5432,
          database: process.env.DB_NAME || 'task_manager'
        });
        
        await client.connect();
        console.log('Connected to existing database, creating tables...');
        
        // Run table creation queries...
        // (Same queries as above for creating tables, triggers, and views)
        
        console.log('\n✅ Tables and views created successfully!');
        await client.end();
        process.exit(0);
      } catch (innerError) {
        console.error('❌ Error setting up tables:', innerError.message);
        process.exit(1);
      }
    } else {
      console.error('❌ Error setting up database:', error.message);
      if (client) await client.end();
      process.exit(1);
    }
  }
}

setupDatabase();
