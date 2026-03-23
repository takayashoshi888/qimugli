export async function onRequestPut(context: any) {
  const { request, env, params } = context;
  const { id } = params;
  try {
    const team = await request.json();
    await env.DB.prepare(
      "UPDATE teams SET name = ?, leaderId = ? WHERE id = ?"
    ).bind(team.name, team.leaderId, id).run();
    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function onRequestDelete(context: any) {
  const { env, params } = context;
  const { id } = params;
  try {
    await env.DB.prepare("DELETE FROM teams WHERE id = ?").bind(id).run();
    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}
