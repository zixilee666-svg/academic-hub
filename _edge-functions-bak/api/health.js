// ========================================
// EdgeOne Edge Function — Health Check
// ========================================
// 低延迟健康检查 (V8 runtime)
// 部署路径: edge-functions/api/health.js

export async function onRequest(context) {
  const { env } = context;
  return new Response(JSON.stringify({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
