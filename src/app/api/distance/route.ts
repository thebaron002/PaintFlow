import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!origin || !destination) {
        return NextResponse.json({ error: 'Missing origin or destination' }, { status: 400 });
    }

    if (!apiKey) {
        return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK') {
            return NextResponse.json({ error: `Google API Error: ${data.status}` }, { status: 500 });
        }

        const element = data.rows[0]?.elements[0];
        console.log('[Distance API] Element data:', element);

        if (element?.status !== 'OK') {
            return NextResponse.json({ error: `No route found: ${element?.status}` }, { status: 404 });
        }

        return NextResponse.json({
            duration: element.duration.text,
            durationValue: element.duration.value,
            distance: element.distance.text,
            distanceValue: element.distance.value
        });
    } catch (error) {
        console.error('Distance calculation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
