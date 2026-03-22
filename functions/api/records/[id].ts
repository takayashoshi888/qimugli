export async function onRequestPut(context: any) {
  const { request, env, params } = context;
  try {
    const id = params.id;
    const record = await request.json();
    await env.DB.prepare(
      `UPDATE records SET 
      userId=?, userName=?, date=?, dayOfWeek=?, siteId=?, siteName=?, 
      headCount=?, parking=?, transport=?, highway=?, notes=?, status=?, teamId=?, teamName=? 
      WHERE id=?`
    ).bind(
      record.userId, record.userName, record.date, record.dayOfWeek,
      record.siteId, record.siteName, record.headCount,
      record.costs?.parking || 0, record.costs?.transport || 0, record.costs?.highway || 0,
      record.notes || null, record.status || 'submitted',
      record.teamId || null, record.teamName || null,
      id
    ).run();
    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function onRequestPatch(context: any) {
  const { request, env, params } = context;
  try {
    const id = params.id;
    const { status } = await request.json();
    await env.DB.prepare(
      "UPDATE records SET status=? WHERE id=?"
    ).bind(status, id).run();
    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function onRequestDelete(context: any) {
  const { env, params } = context;
  try {
    const id = params.id;
    await env.DB.prepare("DELETE FROM records WHERE id=?").bind(id).run();
    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}
