import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface FoodRanking {
  foodName: string
  voteCount: number
  probability: number
  rank: number
  voters: string[]
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

    // 음식별로 그룹화
    const foodGroups = new Map<string, { count: number; voters: string[] }>()

    for (const rec of recommendations) {
      const existing = foodGroups.get(rec.foodName)
      if (existing) {
        existing.count++
        if (!existing.voters.includes(rec.user.name)) {
          existing.voters.push(rec.user.name)
        }
      } else {
        foodGroups.set(rec.foodName, {
          count: 1,
          voters: [rec.user.name],
        })
      }
    }

    // 순위 및 확률 계산
    const rankings: FoodRanking[] = []
    let totalWeight = 0

    // 먼저 가중치 계산
    for (const [foodName, data] of foodGroups) {
      // 기본 가중치: 득표수
      // 가산점: 득표수가 많을수록 추가 가중치
      const baseWeight = data.count
      const bonusWeight = Math.pow(data.count, 1.5) // 득표수의 1.5제곱
      const weight = baseWeight + bonusWeight

      totalWeight += weight

      rankings.push({
        foodName,
        voteCount: data.count,
        probability: weight, // 임시로 weight 저장
        rank: 0,
        voters: data.voters,
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
