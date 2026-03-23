export async function onRequestGet(context: any) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare("SELECT * FROM teams ORDER BY name ASC").all();
    return Response.json(results);
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function onRequestPost(context: any) {
  const { request, env } = context;
  try {
    const team = await request.json();
    await env.DB.prepare(
      "INSERT INTO teams (id, name, leaderId) VALUES (?, ?, ?)"
    ).bind(team.id, team.name, team.leaderId).run();
    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}
