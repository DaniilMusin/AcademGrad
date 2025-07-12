export const handler = async (req: Request) => {
  const data = await req.json();
  console.log('log attempt', data);
  return new Response(JSON.stringify({ status: 'ok' }), { headers: { 'Content-Type': 'application/json' }});
};
