export async function onRequestGet(context: any) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare("SELECT * FROM records ORDER BY date DESC").all();
    // Convert flat DB row back to object structure
    const formatted = results.map((r: any) => ({
      ...r,
      costs: { parking: r.parking, transport: r.transport, highway: r.highway }
    }));
    return Response.json(formatted);
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function onRequestPost(context: any) {
  const { request, env } = context;
  try {
    const record = await request.json();
    const id = record.id || Date.now().toString();
    await env.DB.prepare(
      `INSERT INTO records 
      (id, userId, userName, date, dayOfWeek, siteId, siteName, headCount, parking, transport, highway, notes, status, teamId, teamName) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, record.userId, record.userName, record.date, record.dayOfWeek,
      record.siteId, record.siteName, record.headCount,
      record.costs?.parking || 0, record.costs?.transport || 0, record.costs?.highway || 0,
      record.notes || null, record.status || 'submitted',
      record.teamId || null, record.teamName || null
    ).run();
    return Response.json({ success: true, id });
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}
