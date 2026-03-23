export async function onRequestPut(context: any) {
  const { request, env, params } = context;
  const { id } = params;
  try {
    const site = await request.json();
    await env.DB.prepare(
      "UPDATE sites SET name = ?, address = ?, status = ? WHERE id = ?"
    ).bind(site.name, site.address, site.status, id).run();
    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function onRequestDelete(context: any) {
  const { env, params } = context;
  const { id } = params;
  try {
    await env.DB.prepare("DELETE FROM sites WHERE id = ?").bind(id).run();
    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}
