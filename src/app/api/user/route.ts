import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { name } = await request.json()

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: '이름을 입력해주세요' },
        { status: 400 }
      )
    }

    const trimmedName = name.trim()

    // 이미 존재하는 사용자인지 확인
    let user = await prisma.user.findUnique({
      where: { name: trimmedName },
    })

    // 없으면 새로 생성
    if (!user) {
      user = await prisma.user.create({
        data: { name: trimmedName },
      })
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
    })
  } catch (error) {
    console.error('User API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
