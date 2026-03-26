export async function onRequestGet(context: any) {
  const { env } = context;
  try {
    if (!env.DB) {
      console.warn('DB binding not available, returning empty array');
      return Response.json([]);
    }
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
    const user = await request.json();
    const id = user.id || crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO users (id, name, username, password, role, teamId, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, user.name, user.username, user.password, user.role, user.teamId || null, user.avatar || null).run();
    return Response.json({ success: true, id });
  } catch (e: any) {
    console.error('Users POST error:', e);
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}
