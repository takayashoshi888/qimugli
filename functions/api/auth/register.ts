export async function onRequestPost(context: any) {
  const { request, env } = context;
  try {
    const { name, username, password } = await request.json();
    
    // Check if username exists
    const { results: existing } = await env.DB.prepare(
      "SELECT * FROM users WHERE username = ?"
    ).bind(username).all();

    if (existing && existing.length > 0) {
      return Response.json({ success: false, message: '用户名已存在' });
    }

    const id = Date.now().toString();
    const role = 'STAFF';
    const avatar = `https://picsum.photos/200/200?random=${Date.now()}`;

    await env.DB.prepare(
      "INSERT INTO users (id, name, username, password, role, avatar) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(id, name, username, password, role, avatar).run();

    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}
