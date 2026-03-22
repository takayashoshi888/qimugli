export async function onRequestGet(context: any) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare("SELECT * FROM teams").all();
    return Response.json(results);
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function onRequestPost(context: any) {
  const { request, env } = context;
  try {
    const team = await request.json();
    const id = team.id || Date.now().toString();
    await env.DB.prepare(
      "INSERT INTO teams (id, name, leaderId) VALUES (?, ?, ?)"
    ).bind(id, team.name, team.leaderId || null).run();
    return Response.json({ success: true, id });
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}
