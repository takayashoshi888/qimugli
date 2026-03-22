export async function onRequestGet(context: any) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare("SELECT * FROM users").all();
    return Response.json(results);
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function onRequestPost(context: any) {
  const { request, env } = context;
  try {
    const user = await request.json();
    const id = user.id || Date.now().toString();
    const avatar = user.avatar || `https://picsum.photos/200/200?random=${Date.now()}`;
    await env.DB.prepare(
      "INSERT INTO users (id, name, username, password, role, teamId, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, user.name, user.username, user.password || '123456', user.role || 'STAFF', user.teamId || null, avatar).run();
    return Response.json({ success: true, id });
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}
