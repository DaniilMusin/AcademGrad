export const handler = async (req: Request) => {
  console.log('telegram webhook');
  return new Response('ok');
};
