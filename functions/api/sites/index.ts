export async function onRequestGet(context: any) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare("SELECT * FROM sites ORDER BY name ASC").all();
    return Response.json(results);
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function onRequestPost(context: any) {
  const { request, env } = context;
  try {
    const site = await request.json();
    await env.DB.prepare(
      "INSERT INTO sites (id, name, address, status) VALUES (?, ?, ?, ?)"
    ).bind(site.id, site.name, site.address, site.status).run();
    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}
