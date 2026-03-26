const ensureTeamsSchema = async (db: any) => {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      leaderId TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const { results } = await db.prepare("PRAGMA table_info(teams)").all();
  const hasLeaderId = (results || []).some((column: any) => column.name === 'leaderId');

  if (!hasLeaderId) {
    await db.prepare("ALTER TABLE teams ADD COLUMN leaderId TEXT").run();
  }
};

const normalizeTeamName = (team: any) => typeof team?.name === 'string' ? team.name.trim() : '';

export async function onRequestGet(context: any) {
  const { env } = context;
  try {
    if (!env.DB) {
      console.warn('DB binding not available, returning empty array');
      return Response.json([]);
    }

    await ensureTeamsSchema(env.DB);
    const { results } = await env.DB.prepare("SELECT * FROM teams ORDER BY name ASC").all();
    return Response.json(results || []);
  } catch (e: any) {
    console.error('Teams GET error:', e);
    return Response.json([]);
  }
}

export async function onRequestPost(context: any) {
  const { request, env } = context;
  try {
    if (!env.DB) {
      return Response.json({ success: false, message: 'Database not available' }, { status: 503 });
    }

    const team = await request.json();
    const name = normalizeTeamName(team);

    if (!name) {
      return Response.json({ success: false, message: '团队名称不能为空' }, { status: 400 });
    }

    await ensureTeamsSchema(env.DB);
    const id = team.id || crypto.randomUUID();

    await env.DB.prepare(
      "INSERT INTO teams (id, name, leaderId) VALUES (?, ?, ?)"
    ).bind(id, name, team.leaderId || null).run();

    return Response.json({ success: true, id });
  } catch (e: any) {
    console.error('Teams POST error:', e);
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}

