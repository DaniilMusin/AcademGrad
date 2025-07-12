export const handler = async (req: Request) => {
  console.log('payment webhook');
  return new Response('ok');
};
