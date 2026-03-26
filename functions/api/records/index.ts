const ensureRecordsSchema = async (db: any) => {
  await db.prepare(`CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    userName TEXT NOT NULL,
    date TEXT NOT NULL,
    dayOfWeek TEXT NOT NULL,
    siteId TEXT NOT NULL,
    siteName TEXT NOT NULL,
    headCount INTEGER NOT NULL,
    parking INTEGER NOT NULL DEFAULT 0,
    transport INTEGER NOT NULL DEFAULT 0,
    highway INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'submitted',
    notes TEXT,
    teamId TEXT,
    teamName TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`).run();

  const { results } = await db.prepare("PRAGMA table_info(records)").all();
  const columns = new Set((results || []).map((column: any) => column.name));

  if (!columns.has('teamId')) {
    await db.prepare("ALTER TABLE records ADD COLUMN teamId TEXT").run();
  }

  if (!columns.has('teamName')) {
    await db.prepare("ALTER TABLE records ADD COLUMN teamName TEXT").run();
  }
};

export async function onRequestGet(context: any) {
  const { env } = context;
  try {
    if (!env.DB) {
      console.warn('DB binding not available, returning empty array');
      return Response.json([]);
    }

    await ensureRecordsSchema(env.DB);

    const { results } = await env.DB.prepare("SELECT * FROM records ORDER BY date DESC").all();
    const formatted = (results || []).map((r: any) => ({
      ...r,
      costs: {
        parking: r.parking || 0,
        transport: r.transport || 0,
        highway: r.highway || 0
      }
    }));
    return Response.json(formatted);
  } catch (e: any) {
    console.error('Records GET error:', e);
    return Response.json([]);
  }
}

export async function onRequestPost(context: any) {
  const { request, env } = context;
  try {
    if (!env.DB) {
      return Response.json({ success: false, message: 'Database not available' }, { status: 503 });
    }

    await ensureRecordsSchema(env.DB);

    const record = await request.json();
    const id = record.id || crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO records (id, userId, userName, date, dayOfWeek, siteId, siteName, headCount, parking, transport, highway, status, notes, teamId, teamName) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      id, record.userId, record.userName, record.date, record.dayOfWeek,
      record.siteId, record.siteName, record.headCount,
      record.costs?.parking || 0, record.costs?.transport || 0, record.costs?.highway || 0,
      record.status || 'submitted', record.notes || '',
      record.teamId || null, record.teamName || null
    ).run();
    return Response.json({ success: true, id });
  } catch (e: any) {
    console.error('Records POST error:', e);
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}

