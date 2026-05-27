import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, pass } = body

    if (!email || !pass) {
      return NextResponse.json({ message: 'Email e senha são obrigatórios.' }, { status: 400 })
    }

    const res = await fetch('https://cefis.com.br/api/v1/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, pass }),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { message: data.message || 'Credenciais inválidas.' },
        { status: res.status }
      )
    }

    return NextResponse.json({
      key: data.data.key,
      user: data.data.user,
    })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ message: 'Erro interno. Tente novamente.' }, { status: 500 })
  }
}
