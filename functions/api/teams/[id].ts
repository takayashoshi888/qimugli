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

export async function onRequestPut(context: any) {
  const { request, env, params } = context;
  const { id } = params;
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
    await env.DB.prepare(
      "UPDATE teams SET name = ?, leaderId = ? WHERE id = ?"
    ).bind(name, team.leaderId || null, id).run();

    return Response.json({ success: true });
  } catch (e: any) {
    console.error('Teams PUT error:', e);
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

    await ensureTeamsSchema(env.DB);
    await env.DB.prepare("DELETE FROM teams WHERE id = ?").bind(id).run();
    return Response.json({ success: true });
  } catch (e: any) {
    console.error('Teams DELETE error:', e);
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}

