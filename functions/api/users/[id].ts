const ensureUsersSchema = async (db: any) => {
  await db.prepare(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'STAFF',
    teamId TEXT,
    avatar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`).run();
};

export async function onRequestPut(context: any) {
  const { request, env, params } = context;
  const { id } = params;
  try {
    if (!env.DB) {
      return Response.json({ success: false, message: 'Database not available' }, { status: 503 });
    }

    await ensureUsersSchema(env.DB);

    const user = await request.json();

    const { results } = await env.DB.prepare("SELECT avatar FROM users WHERE id = ?").bind(id).all();
    const existing = results?.[0] as { avatar?: string } | undefined;
    const avatar = user.avatar ?? existing?.avatar ?? null;

    await env.DB.prepare(
      "UPDATE users SET name = ?, username = ?, password = ?, role = ?, teamId = ?, avatar = ? WHERE id = ?"
    ).bind(user.name, user.username, user.password, user.role, user.teamId || null, avatar, id).run();

    return Response.json({ success: true });
  } catch (e: any) {
    console.error('Users PUT error:', e);
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

    await ensureUsersSchema(env.DB);

    await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
    return Response.json({ success: true });
  } catch (e: any) {
    console.error('Users DELETE error:', e);
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}
