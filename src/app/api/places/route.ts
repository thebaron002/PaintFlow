import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get('input');
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!input) {
        return NextResponse.json({ suggestions: [] });
    }

    if (!apiKey) {
        return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });
    }

    try {
        // Using "Places API" REST endpoint (standard)
        // Ensure "Places API" (New or Old) is enabled in Console.
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        const data = await response.json();

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            console.error('Google Places API Error:', data);
            return NextResponse.json({ suggestions: [] });
        }

        const suggestions = data.predictions?.map((p: any) => ({
            description: p.description,
            place_id: p.place_id,
        })) || [];

        return NextResponse.json({ suggestions });
    } catch (error) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
