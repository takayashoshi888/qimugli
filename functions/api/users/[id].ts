export async function onRequestPut(context: any) {
  const { request, env, params } = context;
  const { id } = params;
  try {
    const user = await request.json();
    await env.DB.prepare(
      "UPDATE users SET name = ?, username = ?, password = ?, role = ?, teamId = ?, avatar = ? WHERE id = ?"
    ).bind(user.name, user.username, user.password, user.role, user.teamId, user.avatar, id).run();
    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function onRequestDelete(context: any) {
  const { env, params } = context;
  const { id } = params;
  try {
    await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}
