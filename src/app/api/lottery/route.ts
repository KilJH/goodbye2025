import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isSameFood } from '@/lib/foodTagger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface FoodRanking {
  foodName: string
  voteCount: number
  probability: number
  rank: number
  voters: string[]
  likes: number
  dislikes: number
}

export async function GET() {
  try {
    // 모든 추천 가져오기
    const recommendations = await prisma.foodRecommendation.findMany({
      include: {
        user: {
          select: { name: true },
        },
      },
    })

    // 모든 투표 가져오기
    const allVotes = await prisma.foodVote.findMany()

    // 음식별로 그룹화 (유사한 이름도 같은 그룹으로)
    const foodGroups: {
      representativeName: string
      count: number
      voters: Set<string>
    }[] = []

    for (const rec of recommendations) {
      // 기존 그룹에서 유사한 음식 찾기
      let foundGroup = foodGroups.find(group => isSameFood(group.representativeName, rec.foodName))

      if (foundGroup) {
        foundGroup.count++
        foundGroup.voters.add(rec.user.name)
      } else {
        foodGroups.push({
          representativeName: rec.foodName,
          count: 1,
          voters: new Set([rec.user.name]),
        })
      }
    }

    // 음식별 투표 집계
    const votesByFood = new Map<string, { likes: number; dislikes: number }>()
    for (const vote of allVotes) {
      const existing = votesByFood.get(vote.foodName) || { likes: 0, dislikes: 0 }
      if (vote.voteType === 'like') {
        existing.likes++
      } else {
        existing.dislikes++
      }
      votesByFood.set(vote.foodName, existing)
    }

    // 순위 및 확률 계산
    const rankings: FoodRanking[] = []
    let totalWeight = 0

    // 먼저 가중치 계산
    for (const group of foodGroups) {
      const votes = votesByFood.get(group.representativeName) || { likes: 0, dislikes: 0 }

      // 기본 가중치: 추천수
      const baseWeight = group.count
      // 추천수 보너스: 추천수의 1.5제곱
      const recommendBonus = Math.pow(group.count, 1.5)
      // 좋아요 보너스: 좋아요 1개당 +0.5
      const likeBonus = votes.likes * 0.5
      // 싫어요 페널티: 싫어요 1개당 -0.3
      const dislikePenalty = votes.dislikes * 0.3

      // 최종 가중치 (최소 0.1 보장)
      const weight = Math.max(0.1, baseWeight + recommendBonus + likeBonus - dislikePenalty)

      totalWeight += weight

      rankings.push({
        foodName: group.representativeName,
        voteCount: group.count,
        probability: weight, // 임시로 weight 저장
        rank: 0,
        voters: Array.from(group.voters),
        likes: votes.likes,
        dislikes: votes.dislikes,
      })
    }

    // 확률 정규화 및 정렬
    rankings.forEach((r) => {
      r.probability = totalWeight > 0 ? r.probability / totalWeight : 0
    })

    // 5인 이상 득표는 무조건 1순위
    rankings.sort((a, b) => {
      // 5인 이상 득표 우선
      if (a.voteCount >= 5 && b.voteCount < 5) return -1
      if (b.voteCount >= 5 && a.voteCount < 5) return 1
      // 그 다음 확률순
      return b.probability - a.probability
    })

    // 순위 부여
    rankings.forEach((r, index) => {
      r.rank = index + 1
    })

    // 5인 이상 득표 음식의 확률 조정
    const fiveOrMore = rankings.filter((r) => r.voteCount >= 5)
    if (fiveOrMore.length > 0) {
      // 5인 이상 득표 음식들에게 더 높은 확률 부여
      const topProbability = 0.5 / fiveOrMore.length
      const remainingProbability = 0.5
      const others = rankings.filter((r) => r.voteCount < 5)
      const othersTotalProb = others.reduce((sum, r) => sum + r.probability, 0)

      fiveOrMore.forEach((r) => {
        r.probability = topProbability
      })

      if (othersTotalProb > 0) {
        others.forEach((r) => {
          r.probability = (r.probability / othersTotalProb) * remainingProbability
        })
      }
    }

    return NextResponse.json({
      rankings,
      totalRecommendations: recommendations.length,
      uniqueFoods: rankings.length,
    })
  } catch (error) {
    console.error('Lottery API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
