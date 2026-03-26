export async function onRequestGet(context: any) {
  const { env } = context;
  try {
    if (!env.DB) {
      console.warn('DB binding not available, returning empty array');
      return Response.json([]);
    }
    const { results } = await env.DB.prepare("SELECT * FROM records ORDER BY date DESC").all();
    const formatted = (results || []).map((r: any) => ({
      ...r,
      costs: {
        parking: r.parking || 0,
        transport: r.transport || 0,
        highway: r.highway || 0
      }
    }));
    return Response.json(formatted);
  } catch (e: any) {
    console.error('Records GET error:', e);
    return Response.json([]);
  }
}

export async function onRequestPost(context: any) {
  const { request, env } = context;
  try {
    if (!env.DB) {
      return Response.json({ success: false, message: 'Database not available' }, { status: 503 });
    }
    const record = await request.json();
    const id = record.id || crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO records (id, userId, userName, date, dayOfWeek, siteId, siteName, headCount, parking, transport, highway, status, notes, teamId, teamName) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      id, record.userId, record.userName, record.date, record.dayOfWeek,
      record.siteId, record.siteName, record.headCount,
      record.costs?.parking || 0, record.costs?.transport || 0, record.costs?.highway || 0,
      record.status || 'submitted', record.notes || '',
      record.teamId || null, record.teamName || null
    ).run();
    return Response.json({ success: true, id });
  } catch (e: any) {
    console.error('Records POST error:', e);
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}
