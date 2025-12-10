'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Confetti from '@/components/Confetti'
import Sparkles from '@/components/Sparkles'
import Header from '@/components/Header'
import { SkeletonRankingCard, Spinner } from '@/components/Skeleton'
import { EVENT_INFO } from '@/lib/constants'

interface FoodRanking {
  foodName: string
  voteCount: number
  probability: number
  rank: number
  voters: string[]
}

export default function LotteryPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState('')
  const [rankings, setRankings] = useState<FoodRanking[]>([])
  const [isSpinning, setIsSpinning] = useState(false)
  const [lotteryResult, setLotteryResult] = useState<FoodRanking[]>([])
  const [showResult, setShowResult] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 시간 체크
  useEffect(() => {
    const checkTime = () => {
      const now = new Date()
      const openTime = EVENT_INFO.lotteryOpenTime
      const diff = openTime.getTime() - now.getTime()

      if (diff <= 0) {
        setIsOpen(true)
        setTimeRemaining('')
      } else {
        setIsOpen(false)
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        setTimeRemaining(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        )
      }
    }

    checkTime()
    const interval = setInterval(checkTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // 데이터 로드
  useEffect(() => {
    fetchRankings()
  }, [])

  const fetchRankings = async () => {
    try {
      const res = await fetch('/api/lottery', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      const data = await res.json()
      if (res.ok) {
        setRankings(data.rankings || [])
      } else {
        console.error('API error:', data.error)
      }
    } catch (err) {
      console.error('Failed to fetch rankings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // 가중치 기반 랜덤 순위 리스트 생성
  const runLottery = useCallback(() => {
    if (rankings.length === 0 || isSpinning) return

    setIsSpinning(true)
    setShowResult(false)

    // 5인 이상 득표 음식은 무조건 상위에 배치
    const mustTop = rankings.filter(r => r.voteCount >= 5)
    const others = rankings.filter(r => r.voteCount < 5)

    // 가중치 기반 셔플 함수
    const weightedShuffle = (items: FoodRanking[]): FoodRanking[] => {
      const result: FoodRanking[] = []
      const remaining = [...items]

      while (remaining.length > 0) {
        const totalWeight = remaining.reduce((sum, r) => sum + r.probability, 0)
        let random = Math.random() * totalWeight

        for (let i = 0; i < remaining.length; i++) {
          random -= remaining[i].probability
          if (random <= 0) {
            result.push(remaining[i])
            remaining.splice(i, 1)
            break
          }
        }

        // 안전장치
        if (random > 0 && remaining.length > 0) {
          result.push(remaining[0])
          remaining.splice(0, 1)
        }
      }

      return result
    }

    // 5인 이상은 그들끼리 셔플, 나머지도 가중치 기반 셔플
    const shuffledMustTop = weightedShuffle(mustTop)
    const shuffledOthers = weightedShuffle(others)

    // 최종 결과: 5인 이상 먼저, 그다음 나머지
    const finalResult = [...shuffledMustTop, ...shuffledOthers].map((item, index) => ({
      ...item,
      rank: index + 1
    }))

    // 애니메이션 후 결과 표시
    setTimeout(() => {
      setLotteryResult(finalResult)
      setIsSpinning(false)
      setShowResult(true)
    }, 3000)
  }, [rankings, isSpinning])

  // 순위별 색상
  const getRankColor = (rank: number): string => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-amber-500'
      case 2:
        return 'from-gray-300 to-gray-400'
      case 3:
        return 'from-amber-600 to-amber-700'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  const getRankBadge = (rank: number): string => {
    switch (rank) {
      case 1:
        return '🥇'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return `${rank}위`
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="bg-fixed-full" />
      {showResult && <Confetti />}
      <Sparkles />

      {/* safe-area 상단 패딩 */}
      <div style={{ paddingTop: 'env(safe-area-inset-top)' }} />

      <Header />

      <div className="relative z-10 pb-8 px-4" style={{ paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}>
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
              제비뽑기
            </h1>
            <p className="text-gray-400">
              추천된 음식들의 우선순위를 랜덤으로 뽑아보세요!
            </p>
          </motion.div>

          {/* 오픈 전 카운트다운 */}
          {!isOpen && (
            <motion.div
              className="glass-card rounded-2xl p-8 mb-8 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-white mb-4">
                아직 오픈 전이에요!
              </h2>
              <p className="text-gray-400 mb-6">
                행사 3시간 전에 오픈됩니다
              </p>
              <div className="text-5xl font-mono font-bold text-yellow-400">
                {timeRemaining}
              </div>
              <p className="text-sm text-gray-500 mt-4">
                오픈 예정: 12/12 금 17:00
              </p>
            </motion.div>
          )}

          {/* 오픈 후 제비뽑기 */}
          {isOpen && (
            <>
              {/* 제비뽑기 버튼 */}
              <motion.div
                className="glass-card rounded-2xl p-8 mb-8 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AnimatePresence mode="wait">
                  {isSpinning ? (
                    <motion.div
                      key="spinning"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-8"
                    >
                      <motion.div
                        className="text-8xl mb-4"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                      >
                        🎰
                      </motion.div>
                      <p className="text-2xl text-white font-bold">순위 뽑는 중...</p>
                    </motion.div>
                  ) : showResult && lotteryResult.length > 0 ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-4"
                    >
                      <motion.div
                        className="text-6xl mb-4"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                      >
                        🎉
                      </motion.div>
                      <h2 className="text-2xl font-bold gradient-text mb-6">
                        오늘의 메뉴 우선순위!
                      </h2>

                      {/* 결과 리스트 */}
                      <div className="space-y-3 text-left mb-6">
                        {lotteryResult.map((item, index) => (
                          <motion.div
                            key={item.foodName}
                            className={`relative overflow-hidden rounded-xl p-4 ${
                              index === 0
                                ? 'border-2 border-yellow-400 bg-yellow-400/10'
                                : index < 3
                                ? 'border border-white/20 bg-white/5'
                                : 'border border-white/10 bg-white/5'
                            }`}
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.15 }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <span className={`text-2xl ${index === 0 ? 'animate-bounce' : ''}`}>
                                  {getRankBadge(index + 1)}
                                </span>
                                <div>
                                  <h3 className={`text-lg font-bold ${index === 0 ? 'text-yellow-400' : 'text-white'}`}>
                                    {item.foodName}
                                  </h3>
                                  <p className="text-sm text-gray-400">
                                    {item.voteCount}명 추천
                                    {item.voteCount >= 5 && (
                                      <span className="ml-2 text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full">
                                        필수
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <motion.button
                        onClick={() => {
                          setShowResult(false)
                          setLotteryResult([])
                        }}
                        className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-8 rounded-xl transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        다시 뽑기
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="ready"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="text-8xl mb-6">🎲</div>
                      <p className="text-gray-400 mb-6">
                        버튼을 누르면 추천된 음식들의<br />
                        우선순위가 랜덤으로 결정됩니다!
                      </p>
                      <motion.button
                        onClick={runLottery}
                        disabled={rankings.length === 0}
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-4 px-12 rounded-full text-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {rankings.length === 0 ? '추천된 음식이 없어요' : '🎲 순위 뽑기!'}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* 현재 추천 현황 */}
              <motion.div
                className="glass-card rounded-2xl p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
                  <span>📊</span> 현재 추천 현황
                  {isLoading && <Spinner size="sm" />}
                </h2>

                {isLoading ? (
                  <div className="space-y-3">
                    <SkeletonRankingCard />
                    <SkeletonRankingCard />
                    <SkeletonRankingCard />
                  </div>
                ) : rankings.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    아직 추천된 음식이 없어요
                  </p>
                ) : (
                  <div className="space-y-3">
                    {rankings.map((ranking, index) => (
                      <motion.div
                        key={ranking.foodName}
                        className={`relative overflow-hidden rounded-xl p-4 ${
                          ranking.voteCount >= 5
                            ? 'border-2 border-yellow-400'
                            : 'border border-white/10'
                        }`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        {/* 배경 바 */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-r ${getRankColor(ranking.rank)} opacity-20`}
                          style={{ width: `${ranking.probability * 100}%` }}
                        />

                        <div className="relative flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div>
                              <h3 className="text-lg font-bold text-white">
                                {ranking.foodName}
                                {ranking.voteCount >= 5 && (
                                  <span className="ml-2 text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full">
                                    필수 상위권
                                  </span>
                                )}
                              </h3>
                              <p className="text-sm text-gray-400">
                                추천: {ranking.voters.join(', ')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-white">
                              {ranking.voteCount}표
                            </p>
                            <p className="text-sm text-gray-400">
                              확률 {(ranking.probability * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                <div className="mt-6 p-4 bg-yellow-400/10 rounded-xl border border-yellow-400/20">
                  <p className="text-sm text-yellow-300">
                    💡 <strong>규칙:</strong> 5인 이상 득표한 음식은 무조건 상위권 배치!
                    득표수가 많을수록 높은 순위에 뽑힐 확률이 올라갑니다.
                  </p>
                </div>
              </motion.div>
            </>
          )}

          {/* 네비게이션 */}
          <motion.div
            className="flex justify-center gap-6 mt-8 pb-safe"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <a
              href="/"
              className="text-gray-400 hover:text-yellow-400 transition-colors"
            >
              ← 메인으로
            </a>
            <a
              href="/recommend"
              className="text-gray-400 hover:text-yellow-400 transition-colors"
            >
              음식 추천하기 →
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
