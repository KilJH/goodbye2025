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
  likes: number
  dislikes: number
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

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

    // 모든 투표 가져오기
    const allVotes = await prisma.foodVote.findMany()

    // 음식별 투표 집계
    const votesByFood = new Map<string, { likes: number; dislikes: number }>()
    // 사용자별 투표 상태
    const userVotesByFood = new Map<string, 'like' | 'dislike'>()

    for (const vote of allVotes) {
      const existing = votesByFood.get(vote.foodName) || { likes: 0, dislikes: 0 }
      if (vote.voteType === 'like') {
        existing.likes++
      } else {
        existing.dislikes++
      }
      votesByFood.set(vote.foodName, existing)

      // 현재 사용자의 투표 상태 저장
      if (userId && vote.userId === userId) {
        userVotesByFood.set(vote.foodName, vote.voteType as 'like' | 'dislike')
      }
    }

    // 그룹화된 결과를 배열로 변환 (최신순 정렬)
    const grouped: GroupedRecommendation[] = foodGroups
      .map((group) => {
        const votes = votesByFood.get(group.representativeName) || { likes: 0, dislikes: 0 }
        return {
          foodName: group.representativeName,
          tags: group.tags,
          recommenders: Array.from(group.recommenders),
          count: group.count,
          latestAt: group.latestAt.toISOString(),
          likes: votes.likes,
          dislikes: votes.dislikes,
        }
      })
      .sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime())

    return NextResponse.json({
      recommendations: grouped,
      totalCount: recommendations.length,
      userVotes: Object.fromEntries(userVotesByFood),
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
