import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-cefis-key')

  if (!apiKey) {
    return NextResponse.json({ message: 'API key obrigatória.' }, { status: 401 })
  }

  try {
    // Fetch multiple pages to get a representative sample
    const headers: HeadersInit = {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
    }

    const res = await fetch(
      'https://api-v3.cefis.com.br/courses?count=50&page=1&order=averageRating&orderDirection=desc',
      { headers }
    )

    if (!res.ok) {
      // Try without auth (public endpoint)
      const pubRes = await fetch(
        'https://api-v3.cefis.com.br/courses?count=50&page=1&order=averageRating&orderDirection=desc',
        { headers: { 'Accept': 'application/json' } }
      )
      if (!pubRes.ok) {
        return NextResponse.json({ courses: [], total: 0 })
      }
      const pubData = await pubRes.json()
      return NextResponse.json({ courses: pubData.data || [], total: pubData.total || 0 })
    }

    const data = await res.json()
    return NextResponse.json({ courses: data.data || [], total: data.total || 0 })
  } catch (err) {
    console.error('Courses error:', err)
    return NextResponse.json({ courses: [], total: 0 })
  }
}
