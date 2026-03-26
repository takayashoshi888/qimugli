export async function onRequestPut(context: any) {
  const { request, env, params } = context;
  const { id } = params;
  try {
    if (!env.DB) {
      return Response.json({ success: false, message: 'Database not available' }, { status: 503 });
    }
    const record = await request.json();
    await env.DB.prepare(
      "UPDATE records SET userId = ?, userName = ?, date = ?, dayOfWeek = ?, siteId = ?, siteName = ?, headCount = ?, parking = ?, transport = ?, highway = ?, status = ?, notes = ? WHERE id = ?"
    ).bind(
      record.userId, record.userName, record.date, record.dayOfWeek,
      record.siteId, record.siteName, record.headCount,
      record.costs?.parking || 0, record.costs?.transport || 0, record.costs?.highway || 0,
      record.status, record.notes || '', id
    ).run();
    return Response.json({ success: true });
  } catch (e: any) {
    console.error('Records PUT error:', e);
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function onRequestPatch(context: any) {
  const { request, env, params } = context;
  const { id } = params;
  try {
    if (!env.DB) {
      return Response.json({ success: false, message: 'Database not available' }, { status: 503 });
    }
    const { status } = await request.json();
    await env.DB.prepare("UPDATE records SET status = ? WHERE id = ?").bind(status, id).run();
    return Response.json({ success: true });
  } catch (e: any) {
    console.error('Records PATCH error:', e);
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function onRequestDelete(context: any) {
  const { env, params } = context;
  const { id } = params;
  try {
    if (!env.DB) {
      return Response.json({ success: false, message: 'Database not available' }, { status: 503 });
    }
    await env.DB.prepare("DELETE FROM records WHERE id = ?").bind(id).run();
    return Response.json({ success: true });
  } catch (e: any) {
    console.error('Records DELETE error:', e);
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}
