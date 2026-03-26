export async function onRequestGet(context: any) {
  const { env } = context;
  try {
    if (!env.DB) {
      console.warn('DB binding not available, returning empty array');
      return Response.json([]);
    }
    const { results } = await env.DB.prepare("SELECT * FROM sites ORDER BY name ASC").all();
    return Response.json(results || []);
  } catch (e: any) {
    console.error('Sites GET error:', e);
    return Response.json([]);
  }
}

export async function onRequestPost(context: any) {
  const { request, env } = context;
  try {
    if (!env.DB) {
      return Response.json({ success: false, message: 'Database not available' }, { status: 503 });
    }
    const site = await request.json();
    const id = site.id || crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO sites (id, name, address, status) VALUES (?, ?, ?, ?)"
    ).bind(id, site.name, site.address, site.status || 'active').run();
    return Response.json({ success: true, id });
  } catch (e: any) {
    console.error('Sites POST error:', e);
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}
