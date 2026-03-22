export async function onRequestPut(context: any) {
  const { request, env, params } = context;
  try {
    const id = params.id;
    const user = await request.json();
    await env.DB.prepare(
      "UPDATE users SET name=?, role=?, teamId=?, avatar=? WHERE id=?"
    ).bind(user.name, user.role, user.teamId || null, user.avatar, id).run();
    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function onRequestDelete(context: any) {
  const { env, params } = context;
  try {
    const id = params.id;
    await env.DB.prepare("DELETE FROM users WHERE id=?").bind(id).run();
    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}
