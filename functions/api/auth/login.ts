export async function onRequestPost(context: any) {
  const { request, env } = context;
  try {
    const { username, password } = await request.json();
    const { results } = await env.DB.prepare(
      "SELECT * FROM users WHERE username = ? AND password = ?"
    ).bind(username, password).all();

    if (results && results.length > 0) {
      const user = results[0];
      return Response.json({ success: true, user });
    } else {
      return Response.json({ success: false, message: '用户名或密码错误' });
    }
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}
