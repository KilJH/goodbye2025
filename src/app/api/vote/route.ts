import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// 특정 음식의 투표 현황 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const foodName = searchParams.get('foodName')
    const userId = searchParams.get('userId')

    if (!foodName) {
      return NextResponse.json(
        { error: '음식 이름이 필요합니다' },
        { status: 400 }
      )
    }

    // 해당 음식의 좋아요/싫어요 수 조회
    const [likes, dislikes] = await Promise.all([
      prisma.foodVote.count({
        where: { foodName, voteType: 'like' },
      }),
      prisma.foodVote.count({
        where: { foodName, voteType: 'dislike' },
      }),
    ])

    // 사용자의 투표 상태 조회
    let userVote = null
    if (userId) {
      const vote = await prisma.foodVote.findUnique({
        where: {
          foodName_userId: { foodName, userId },
        },
      })
      userVote = vote?.voteType || null
    }

    return NextResponse.json({
      foodName,
      likes,
      dislikes,
      userVote,
    })
  } catch (error) {
    console.error('Get vote error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 투표하기 (좋아요/싫어요)
export async function POST(request: Request) {
  try {
    const { foodName, voteType, userId } = await request.json()

    if (!foodName || !voteType || !userId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다' },
        { status: 400 }
      )
    }

    if (voteType !== 'like' && voteType !== 'dislike') {
      return NextResponse.json(
        { error: '유효하지 않은 투표 유형입니다' },
        { status: 400 }
      )
    }

    // 사용자 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 기존 투표 확인
    const existingVote = await prisma.foodVote.findUnique({
      where: {
        foodName_userId: { foodName, userId },
      },
    })

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // 같은 투표를 다시 누르면 취소
        await prisma.foodVote.delete({
          where: { id: existingVote.id },
        })
        return NextResponse.json({
          message: '투표가 취소되었습니다',
          action: 'removed',
          voteType: null,
        })
      } else {
        // 다른 투표로 변경
        await prisma.foodVote.update({
          where: { id: existingVote.id },
          data: { voteType },
        })
        return NextResponse.json({
          message: '투표가 변경되었습니다',
          action: 'changed',
          voteType,
        })
      }
    }

    // 새 투표 생성
    await prisma.foodVote.create({
      data: {
        foodName,
        voteType,
        userId,
      },
    })

    return NextResponse.json({
      message: '투표가 등록되었습니다',
      action: 'created',
      voteType,
    })
  } catch (error) {
    console.error('Post vote error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
