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

export async function onRequestPut(context: any) {
  const { request, env, params } = context;
  const { id } = params;
  try {
    if (!env.DB) {
      return Response.json({ success: false, message: 'Database not available' }, { status: 503 });
    }

    await ensureRecordsSchema(env.DB);

    const record = await request.json();
    await env.DB.prepare(
      "UPDATE records SET userId = ?, userName = ?, date = ?, dayOfWeek = ?, siteId = ?, siteName = ?, headCount = ?, parking = ?, transport = ?, highway = ?, status = ?, notes = ?, teamId = ?, teamName = ? WHERE id = ?"
    ).bind(
      record.userId, record.userName, record.date, record.dayOfWeek,
      record.siteId, record.siteName, record.headCount,
      record.costs?.parking || 0, record.costs?.transport || 0, record.costs?.highway || 0,
      record.status, record.notes || '', record.teamId || null, record.teamName || null, id
    ).run();
    return Response.json({ success: true });
  } catch (e: any) {
    console.error('Records PUT error:', e);
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function onRequestPatch(context: any) {
  const { request, env, params } = context;
  const { id } = params;
  try {
    if (!env.DB) {
      return Response.json({ success: false, message: 'Database not available' }, { status: 503 });
    }

    await ensureRecordsSchema(env.DB);

    const { status } = await request.json();
    await env.DB.prepare("UPDATE records SET status = ? WHERE id = ?").bind(status, id).run();
    return Response.json({ success: true });
  } catch (e: any) {
    console.error('Records PATCH error:', e);
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function onRequestDelete(context: any) {
  const { env, params } = context;
  const { id } = params;
  try {
    if (!env.DB) {
      return Response.json({ success: false, message: 'Database not available' }, { status: 503 });
    }

    await ensureRecordsSchema(env.DB);

    await env.DB.prepare("DELETE FROM records WHERE id = ?").bind(id).run();
    return Response.json({ success: true });
  } catch (e: any) {
    console.error('Records DELETE error:', e);
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}
