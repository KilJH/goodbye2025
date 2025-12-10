import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { findSimilarFood } from '@/lib/foodTagger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const recommendations = await prisma.foodRecommendation.findMany({
      include: {
        user: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(
      recommendations.map((rec) => ({
        id: rec.id,
        foodName: rec.foodName,
        tags: rec.tags,
        userName: rec.user.name,
        createdAt: rec.createdAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error('Get recommendations error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { foodName, tags, userId } = await request.json()

    if (!foodName || typeof foodName !== 'string' || foodName.trim().length === 0) {
      return NextResponse.json(
        { error: '음식 이름을 입력해주세요' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
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

    const trimmedFoodName = foodName.trim()

    // 기존 추천 목록에서 유사한 음식 찾기
    const existingRecommendations = await prisma.foodRecommendation.findMany({
      select: { foodName: true },
    })

    const existingFoodNames = [...new Set(existingRecommendations.map((r) => r.foodName))]
    const similarFood = findSimilarFood(trimmedFoodName, existingFoodNames)

    // 유사한 음식이 있으면 해당 이름으로 저장 (가산점 적용을 위해)
    const finalFoodName = similarFood || trimmedFoodName
    const bonusApplied = similarFood !== null

    // 추천 저장
    const recommendation = await prisma.foodRecommendation.create({
      data: {
        foodName: finalFoodName,
        tags: tags || [],
        userId,
      },
      include: {
        user: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json({
      id: recommendation.id,
      foodName: recommendation.foodName,
      tags: recommendation.tags,
      userName: recommendation.user.name,
      bonusApplied,
      message: bonusApplied
        ? `"${similarFood}"과(와) 동일한 음식으로 인식되어 가산점이 적용됩니다!`
        : undefined,
    })
  } catch (error) {
    console.error('Post recommendation error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
