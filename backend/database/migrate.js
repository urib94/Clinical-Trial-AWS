const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

class DatabaseMigrator {
    constructor() {
        this.pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'clinical_trial_dev',
            user: process.env.DB_USER || 'api_user',
            password: process.env.DB_PASSWORD || 'api_password',
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
    }

    async connect() {
        try {
            const client = await this.pool.connect();
            console.log('✅ Connected to PostgreSQL database');
            client.release();
            return true;
        } catch (error) {
            console.error('❌ Failed to connect to database:', error.message);
            return false;
        }
    }

    async createMigrationsTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                checksum VARCHAR(64) NOT NULL
            );
        `;
        
        try {
            await this.pool.query(query);
            console.log('✅ Migrations table created/verified');
        } catch (error) {
            console.error('❌ Failed to create migrations table:', error.message);
            throw error;
        }
    }

    async getExecutedMigrations() {
        try {
            const result = await this.pool.query(
                'SELECT filename FROM migrations ORDER BY executed_at'
            );
            return result.rows.map(row => row.filename);
        } catch (error) {
            console.error('❌ Failed to get executed migrations:', error.message);
            return [];
        }
    }

    async executeMigration(filename, sql) {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Execute the migration SQL
            await client.query(sql);
            
            // Record the migration
            const checksum = require('crypto')
                .createHash('sha256')
                .update(sql)
                .digest('hex');
            
            await client.query(
                'INSERT INTO migrations (filename, checksum) VALUES ($1, $2)',
                [filename, checksum]
            );
            
            await client.query('COMMIT');
            console.log(`✅ Executed migration: ${filename}`);
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`❌ Failed to execute migration ${filename}:`, error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    async runMigrations(migrationsDir) {
        try {
            const migrationFiles = await fs.readdir(migrationsDir);
            const sqlFiles = migrationFiles
                .filter(file => file.endsWith('.sql'))
                .sort();

            const executedMigrations = await this.getExecutedMigrations();
            
            for (const file of sqlFiles) {
                if (!executedMigrations.includes(file)) {
                    const filePath = path.join(migrationsDir, file);
                    const sql = await fs.readFile(filePath, 'utf8');
                    await this.executeMigration(file, sql);
                } else {
                    console.log(`⏭️  Skipping already executed migration: ${file}`);
                }
            }
            
            console.log('✅ All migrations completed successfully');
        } catch (error) {
            console.error('❌ Migration process failed:', error.message);
            throw error;
        }
    }

    async rollbackLastMigration() {
        const client = await this.pool.connect();
        
        try {
            const result = await client.query(
                'SELECT filename FROM migrations ORDER BY executed_at DESC LIMIT 1'
            );
            
            if (result.rows.length === 0) {
                console.log('No migrations to rollback');
                return;
            }
            
            const lastMigration = result.rows[0].filename;
            
            // For simplicity, we'll assume rollback files are named with 'rollback_' prefix
            const rollbackFile = `rollback_${lastMigration}`;
            const migrationsDir = path.join(__dirname, 'migrations');
            const rollbackPath = path.join(migrationsDir, rollbackFile);
            
            try {
                const rollbackSql = await fs.readFile(rollbackPath, 'utf8');
                
                await client.query('BEGIN');
                await client.query(rollbackSql);
                await client.query(
                    'DELETE FROM migrations WHERE filename = $1',
                    [lastMigration]
                );
                await client.query('COMMIT');
                
                console.log(`✅ Rolled back migration: ${lastMigration}`);
            } catch (fsError) {
                console.log(`⚠️  No rollback file found for: ${lastMigration}`);
                console.log('Manual rollback required');
            }
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Rollback failed:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    async getStatus() {
        try {
            const executedCount = await this.pool.query(
                'SELECT COUNT(*) as count FROM migrations'
            );
            
            const migrationsDir = path.join(__dirname, 'migrations');
            const migrationFiles = await fs.readdir(migrationsDir).catch(() => []);
            const pendingCount = migrationFiles.filter(f => f.endsWith('.sql')).length - 
                                executedCount.rows[0].count;
            
            console.log('\n📊 Migration Status:');
            console.log(`   Executed: ${executedCount.rows[0].count}`);
            console.log(`   Pending: ${Math.max(0, pendingCount)}`);
            
            const lastMigration = await this.pool.query(
                'SELECT filename, executed_at FROM migrations ORDER BY executed_at DESC LIMIT 1'
            );
            
            if (lastMigration.rows.length > 0) {
                console.log(`   Last: ${lastMigration.rows[0].filename} (${lastMigration.rows[0].executed_at})`);
            }
            
        } catch (error) {
            console.error('❌ Failed to get status:', error.message);
        }
    }

    async reset() {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Drop all tables except migrations
            const dropTablesQuery = `
                DO $$ DECLARE
                    r RECORD;
                BEGIN
                    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'migrations') LOOP
                        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
                    END LOOP;
                END $$;
            `;
            
            await client.query(dropTablesQuery);
            await client.query('DELETE FROM migrations');
            await client.query('COMMIT');
            
            console.log('✅ Database reset completed');
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Database reset failed:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    async close() {
        await this.pool.end();
        console.log('✅ Database connection closed');
    }
}

// CLI interface
async function main() {
    const migrator = new DatabaseMigrator();
    const command = process.argv[2];
    
    try {
        if (!(await migrator.connect())) {
            process.exit(1);
        }
        
        await migrator.createMigrationsTable();
        
        switch (command) {
            case 'up':
            case 'migrate':
                const migrationsDir = path.join(__dirname, 'migrations');
                await migrator.runMigrations(migrationsDir);
                break;
                
            case 'down':
            case 'rollback':
                await migrator.rollbackLastMigration();
                break;
                
            case 'status':
                await migrator.getStatus();
                break;
                
            case 'reset':
                console.log('⚠️  This will delete all data. Are you sure? (CTRL+C to cancel)');
                // In a real implementation, you might want to add a confirmation prompt
                await migrator.reset();
                break;
                
            default:
                console.log('📖 Usage:');
                console.log('  node migrate.js up        - Run pending migrations');
                console.log('  node migrate.js down      - Rollback last migration');
                console.log('  node migrate.js status    - Show migration status');
                console.log('  node migrate.js reset     - Reset database (destructive)');
                break;
        }
        
    } catch (error) {
        console.error('💥 Migration failed:', error.message);
        process.exit(1);
    } finally {
        await migrator.close();
    }
}

// Export for use as module
module.exports = DatabaseMigrator;

// Run as CLI if called directly
if (require.main === module) {
    main();
}