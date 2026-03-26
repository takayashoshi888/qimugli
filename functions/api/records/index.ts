export async function onRequestGet(context: any) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare("SELECT * FROM records ORDER BY date DESC").all();
    const formatted = results.map((r: any) => ({
      ...r,
      costs: {
        parking: r.parking,
        transport: r.transport,
        highway: r.highway
      }
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
    const id = record.id || crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO records (id, userId, userName, date, dayOfWeek, siteId, siteName, headCount, parking, transport, highway, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      id, record.userId, record.userName, record.date, record.dayOfWeek,
      record.siteId, record.siteName, record.headCount,
      record.costs.parking, record.costs.transport, record.costs.highway,
      record.status, record.notes
    ).run();
    return Response.json({ success: true, id });
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}
