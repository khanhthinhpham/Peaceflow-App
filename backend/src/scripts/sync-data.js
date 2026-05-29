import pkg from 'pg';

const { Pool } = pkg;

const SOURCE_DATABASE_URL = process.env.SOURCE_DATABASE_URL;
const TARGET_DATABASE_URL = process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL;

const TABLE_ORDER = [
  'users',
  'user_profiles',
  'user_progress',
  'refresh_tokens',
  'badges',
  'user_badges',
  'assessments',
  'assessment_results',
  'tasks',
  'user_task_assignments',
  'task_completions',
  'mood_checkins',
  'journal_entries',
  'user_journals',
  'risk_snapshots',
  'emergency_logs',
  'audit_logs',
  'recommendation_logs',
  'experts',
  'expert_bookings',
  'community_posts',
  'community_comments',
  'community_reactions'
];

const TABLE_CONFLICT_COLUMNS = {
  assessments: ['code'],
  experts: ['code']
};

if (!SOURCE_DATABASE_URL) {
  console.error('Missing SOURCE_DATABASE_URL');
  process.exit(1);
}

if (!TARGET_DATABASE_URL) {
  console.error('Missing TARGET_DATABASE_URL');
  process.exit(1);
}

const sourceDb = new Pool({ connectionString: SOURCE_DATABASE_URL });
const targetDb = new Pool({ connectionString: TARGET_DATABASE_URL });

async function main() {
  try {
    for (const tableName of TABLE_ORDER) {
      const sourceExists = await tableExists(sourceDb, tableName);
      const targetExists = await tableExists(targetDb, tableName);

      if (!sourceExists || !targetExists) {
        console.log(`Skipping ${tableName}: table missing in ${!sourceExists ? 'source' : 'target'}.`);
        continue;
      }

      const columns = await getColumns(sourceDb, tableName);
      const targetColumnTypes = await getColumnTypes(targetDb, tableName);
      const pkColumns = await getPrimaryKeyColumns(targetDb, tableName);
      const conflictColumns = TABLE_CONFLICT_COLUMNS[tableName] || pkColumns;
      const rows = await readRows(sourceDb, tableName, columns);

      if (!rows.length) {
        console.log(`Skipping ${tableName}: no rows.`);
        continue;
      }

      await upsertRows(targetDb, tableName, columns, conflictColumns, rows, targetColumnTypes);
      console.log(`Synced ${tableName}: ${rows.length} row(s).`);
    }
  } finally {
    await sourceDb.end();
    await targetDb.end();
  }
}

async function tableExists(pool, tableName) {
  const result = await pool.query(
    `select 1
     from information_schema.tables
     where table_schema = 'public' and table_name = $1
     limit 1`,
    [tableName]
  );

  return Boolean(result.rowCount);
}

async function getColumns(pool, tableName) {
  const result = await pool.query(
    `select column_name
     from information_schema.columns
     where table_schema = 'public' and table_name = $1
     order by ordinal_position`,
    [tableName]
  );

  return result.rows.map((row) => row.column_name);
}

async function getColumnTypes(pool, tableName) {
  const result = await pool.query(
    `select column_name, data_type, udt_name
     from information_schema.columns
     where table_schema = 'public' and table_name = $1`,
    [tableName]
  );

  return Object.fromEntries(
    result.rows.map((row) => [
      row.column_name,
      { dataType: row.data_type, udtName: row.udt_name }
    ])
  );
}

async function getPrimaryKeyColumns(pool, tableName) {
  const result = await pool.query(
    `select kcu.column_name
     from information_schema.table_constraints tc
     join information_schema.key_column_usage kcu
       on tc.constraint_name = kcu.constraint_name
      and tc.table_schema = kcu.table_schema
     where tc.table_schema = 'public'
       and tc.table_name = $1
       and tc.constraint_type = 'PRIMARY KEY'
     order by kcu.ordinal_position`,
    [tableName]
  );

  return result.rows.map((row) => row.column_name);
}

async function readRows(pool, tableName, columns) {
  const quotedColumns = columns.map(quoteIdent).join(', ');
  const result = await pool.query(`select ${quotedColumns} from ${quoteTable(tableName)}`);
  return result.rows;
}

async function upsertRows(pool, tableName, columns, conflictColumns, rows, targetColumnTypes) {
  const quotedColumns = columns.map(quoteIdent).join(', ');
  const valuePlaceholders = columns.map((_, index) => `$${index + 1}`).join(', ');
  const conflictClause = buildConflictClause(columns, conflictColumns);
  const sql = `
    insert into ${quoteTable(tableName)} (${quotedColumns})
    values (${valuePlaceholders})
    ${conflictClause}
  `;

  const client = await pool.connect();

  try {
    await client.query('begin');
    for (const row of rows) {
      const values = columns.map((column) =>
        normalizeValue(row[column], targetColumnTypes[column], tableName, column)
      );
      try {
        await client.query(sql, values);
      } catch (error) {
        const rowPreview = buildRowPreview(row, columns);
        throw new Error(`${tableName}: ${error.message}. Row: ${rowPreview}`);
      }
    }
    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

function buildConflictClause(columns, pkColumns) {
  if (!pkColumns.length) {
    return 'on conflict do nothing';
  }

  const nonPkColumns = columns.filter((column) => !pkColumns.includes(column));
  const quotedPkColumns = pkColumns.map(quoteIdent).join(', ');

  if (!nonPkColumns.length) {
    return `on conflict (${quotedPkColumns}) do nothing`;
  }

  const updateSet = nonPkColumns
    .map((column) => `${quoteIdent(column)} = excluded.${quoteIdent(column)}`)
    .join(', ');

  return `on conflict (${quotedPkColumns}) do update set ${updateSet}`;
}

function quoteTable(tableName) {
  return `public.${quoteIdent(tableName)}`;
}

function quoteIdent(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function normalizeValue(value, columnType, tableName, columnName) {
  if (value == null || !columnType) {
    return value;
  }

  const isJsonColumn =
    columnType.dataType === 'json' ||
    columnType.dataType === 'jsonb' ||
    columnType.udtName === 'json' ||
    columnType.udtName === 'jsonb';

  if (!isJsonColumn) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value));
    } catch (error) {
      throw new Error(
        `${tableName}.${columnName}: invalid JSON value "${value.slice(0, 120)}"`
      );
    }
  }

  return JSON.stringify(value);
}

function buildRowPreview(row, columns) {
  const preview = {};

  for (const column of columns) {
    const value = row[column];
    if (value == null) {
      preview[column] = value;
      continue;
    }

    if (typeof value === 'object') {
      preview[column] = safeTruncate(JSON.stringify(value));
      continue;
    }

    preview[column] = safeTruncate(String(value));
  }

  return JSON.stringify(preview);
}

function safeTruncate(value, maxLength = 160) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

main().catch((error) => {
  console.error('Data sync failed:', error.message);
  process.exit(1);
});
