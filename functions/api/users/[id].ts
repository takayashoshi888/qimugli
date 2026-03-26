export async function onRequestPut(context: any) {
  const { request, env, params } = context;
  const { id } = params;
  try {
    if (!env.DB) {
      return Response.json({ success: false, message: 'Database not available' }, { status: 503 });
    }
    const user = await request.json();
    await env.DB.prepare(
      "UPDATE users SET name = ?, username = ?, password = ?, role = ?, teamId = ?, avatar = ? WHERE id = ?"
    ).bind(user.name, user.username, user.password, user.role, user.teamId || null, user.avatar || null, id).run();
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
    await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
    return Response.json({ success: true });
  } catch (e: any) {
    console.error('Users DELETE error:', e);
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}
