/**
 * Proxy route to forward flood status requests to the backend
 * Prevents CORS issues and centralizes API communication
 */

export async function POST(req) {
  try {
    const body = await req.json();
    const { district, coordinates } = body;
    
    console.log('API Route received:', { district, coordinates });
    
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    console.log('Calling backend at:', backendUrl);
    
    const response = await fetch(`${backendUrl}/api/flood-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ district, coordinates })
    });

    console.log('Backend response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Backend error:', errorData);
      return Response.json(
        { error: `Backend error: ${response.status}`, details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Backend returned:', data);
    return Response.json(data);
  } catch (error) {
    console.error('API route error:', error.message);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
