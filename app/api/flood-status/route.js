/**
 * Proxy route to forward flood status requests to the backend
 * Prevents CORS issues and centralizes API communication
 */

export async function POST(req) {
  try {
    const { district, coordinates } = await req.json();
    
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    const response = await fetch(`${backendUrl}/api/flood-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ district, coordinates })
    });

    if (!response.ok) {
      return Response.json(
        { error: 'Failed to fetch flood data from backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
