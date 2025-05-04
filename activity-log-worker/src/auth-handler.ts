export async function authHandler(request: Request, env: any) {
  console.log('Auth Handler - Env Keys:', Object.keys(env || {})); // Log env keys
  const token = request.headers.get('X-Auth-Token');
  const expectedToken = env?.AUTH_TOKEN; // Safely access AUTH_TOKEN
  console.log('Auth Handler - Received Token:', token);
  console.log('Auth Handler - Expected Token:', expectedToken);
  const valid = token === expectedToken;
  console.log('Auth Handler - Is Valid:', valid);
  if (!valid) {
    console.log('Auth Handler - Unauthorized access attempt');
    return new Response('Unauthorized', { status: 401 });
  }
  console.log('Auth Handler - Authorized');
  // Return undefined instead of null, although null should also work fine with itty-router v3/v4
  return undefined; // proceed to next
}
