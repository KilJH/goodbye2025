'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Confetti from '@/components/Confetti'
import Sparkles from '@/components/Sparkles'
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
  const [selectedFood, setSelectedFood] = useState<FoodRanking | null>(null)
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
      const res = await fetch('/api/lottery')
      const data = await res.json()
      if (res.ok) {
        setRankings(data.rankings || [])
      }
    } catch (err) {
      console.error('Failed to fetch rankings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // 제비뽑기 실행
  const runLottery = useCallback(() => {
    if (rankings.length === 0 || isSpinning) return

    setIsSpinning(true)
    setShowResult(false)

    // 확률에 따라 랜덤 선택
    const totalProbability = rankings.reduce((sum, r) => sum + r.probability, 0)
    let random = Math.random() * totalProbability
    let selected: FoodRanking | null = null

    for (const ranking of rankings) {
      random -= ranking.probability
      if (random <= 0) {
        selected = ranking
        break
      }
    }

    if (!selected) {
      selected = rankings[0]
    }

    // 애니메이션 후 결과 표시
    setTimeout(() => {
      setSelectedFood(selected)
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
    <div className="min-h-screen bg-gradient-party relative overflow-hidden">
      {showResult && <Confetti />}
      <Sparkles />

      <div className="relative z-10 min-h-screen py-12 px-4">
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
              추천된 음식 중 오늘의 메뉴를 뽑아보세요!
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
                      <p className="text-2xl text-white font-bold">뽑는 중...</p>
                    </motion.div>
                  ) : showResult && selectedFood ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-8"
                    >
                      <motion.div
                        className="text-8xl mb-4"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                      >
                        🎉
                      </motion.div>
                      <h2 className="text-3xl font-bold gradient-text mb-2">
                        당첨!
                      </h2>
                      <p className="text-4xl font-bold text-white mb-4">
                        {selectedFood.foodName}
                      </p>
                      <p className="text-gray-400">
                        {selectedFood.voteCount}명이 추천 |
                        확률 {(selectedFood.probability * 100).toFixed(1)}%
                      </p>
                      <motion.button
                        onClick={() => {
                          setShowResult(false)
                          setSelectedFood(null)
                        }}
                        className="mt-6 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-8 rounded-xl transition-all"
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
                      <motion.button
                        onClick={runLottery}
                        disabled={rankings.length === 0}
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-4 px-12 rounded-full text-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {rankings.length === 0 ? '추천된 음식이 없어요' : '뽑기!'}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* 순위표 */}
              <motion.div
                className="glass-card rounded-2xl p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                  <span>🏆</span> 현재 순위
                </h2>

                {isLoading ? (
                  <div className="text-center py-8 text-gray-400">
                    로딩 중...
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
                            <span className="text-2xl">{getRankBadge(ranking.rank)}</span>
                            <div>
                              <h3 className="text-lg font-bold text-white">
                                {ranking.foodName}
                                {ranking.voteCount >= 5 && (
                                  <span className="ml-2 text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full">
                                    필수 1순위
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
                              {(ranking.probability * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                <div className="mt-6 p-4 bg-yellow-400/10 rounded-xl border border-yellow-400/20">
                  <p className="text-sm text-yellow-300">
                    💡 <strong>규칙:</strong> 5인 이상 득표한 음식은 무조건 1순위!
                    동일 음식 추천 시 가산점이 적용됩니다.
                  </p>
                </div>
              </motion.div>
            </>
          )}

          {/* 네비게이션 */}
          <motion.div
            className="flex justify-center gap-6 mt-8"
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
