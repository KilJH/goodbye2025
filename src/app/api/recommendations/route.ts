import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { findSimilarFood, isSameFood } from '@/lib/foodTagger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface GroupedRecommendation {
  foodName: string
  tags: string[]
  recommenders: string[]
  count: number
  latestAt: string
}

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

    // 음식별로 그룹화 (유사한 이름도 같은 그룹으로)
    const foodGroups: {
      representativeName: string
      tags: string[]
      recommenders: Set<string>
      count: number
      latestAt: Date
    }[] = []

    for (const rec of recommendations) {
      // 기존 그룹에서 유사한 음식 찾기
      let foundGroup = foodGroups.find(group => isSameFood(group.representativeName, rec.foodName))

      if (foundGroup) {
        foundGroup.count++
        foundGroup.recommenders.add(rec.user.name)
        if (rec.createdAt > foundGroup.latestAt) {
          foundGroup.latestAt = rec.createdAt
          foundGroup.tags = rec.tags
        }
      } else {
        // 새 그룹 생성
        foodGroups.push({
          representativeName: rec.foodName,
          tags: rec.tags,
          recommenders: new Set([rec.user.name]),
          count: 1,
          latestAt: rec.createdAt,
        })
      }
    }

    // 그룹화된 결과를 배열로 변환 (최신순 정렬)
    const grouped: GroupedRecommendation[] = foodGroups
      .map((group) => ({
        foodName: group.representativeName,
        tags: group.tags,
        recommenders: Array.from(group.recommenders),
        count: group.count,
        latestAt: group.latestAt.toISOString(),
      }))
      .sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime())

    return NextResponse.json({
      recommendations: grouped,
      totalCount: recommendations.length,
    })
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
