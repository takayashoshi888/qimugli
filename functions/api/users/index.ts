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

export async function onRequestGet(context: any) {
  const { env } = context;
  try {
    if (!env.DB) {
      console.warn('DB binding not available, returning empty array');
      return Response.json([]);
    }

    await ensureUsersSchema(env.DB);

    const { results } = await env.DB.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
    return Response.json(results || []);
  } catch (e: any) {
    console.error('Users GET error:', e);
    return Response.json([]);
  }
}

export async function onRequestPost(context: any) {
  const { request, env } = context;
  try {
    if (!env.DB) {
      return Response.json({ success: false, message: 'Database not available' }, { status: 503 });
    }

    await ensureUsersSchema(env.DB);

    const user = await request.json();
    const id = user.id || crypto.randomUUID();

    const avatar = user.avatar || `https://picsum.photos/200/200?random=${Date.now()}`;

    await env.DB.prepare(
      "INSERT INTO users (id, name, username, password, role, teamId, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, user.name, user.username, user.password, user.role, user.teamId || null, avatar).run();

    return Response.json({ success: true, id });
  } catch (e: any) {
    console.error('Users POST error:', e);
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}
