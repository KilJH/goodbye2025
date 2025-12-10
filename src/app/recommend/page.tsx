'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Sparkles from '@/components/Sparkles'
import Header from '@/components/Header'
import { useUserStore } from '@/lib/store'
import { generateFoodTags } from '@/lib/foodTagger'

interface Recommendation {
  id: string
  foodName: string
  tags: string[]
  userName: string
  createdAt: string
}

export default function RecommendPage() {
  const [foodName, setFoodName] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [bonusMessage, setBonusMessage] = useState('')
  const [isHydrated, setIsHydrated] = useState(false)
  const router = useRouter()
  const { userId, userName } = useUserStore()

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    try {
      const res = await fetch('/api/recommendations', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      const data = await res.json()
      if (res.ok) {
        setRecommendations(data)
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err)
    }
  }

  // 음식 이름이 변경될 때마다 태그 생성
  useEffect(() => {
    if (foodName.trim()) {
      const generatedTags = generateFoodTags(foodName)
      setTags(generatedTags)
    } else {
      setTags([])
    }
  }, [foodName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!foodName.trim()) {
      setError('음식 이름을 입력해주세요!')
      return
    }

    if (!userId) {
      setError('먼저 이름을 입력해주세요!')
      router.push('/')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')
    setBonusMessage('')

    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodName: foodName.trim(),
          tags,
          userId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '오류가 발생했습니다')
      }

      setSuccess(`"${foodName}" 추천이 등록되었습니다!`)
      if (data.bonusApplied) {
        setBonusMessage(`🎉 다른 사람도 추천한 음식이에요! 가산점이 적용됩니다!`)
      }
      setFoodName('')
      setTags([])
      fetchRecommendations()
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 태그 색상 맵핑
  const getTagColor = (tag: string): string => {
    const colorMap: Record<string, string> = {
      한식: 'bg-red-500/20 text-red-300 border-red-500/30',
      중식: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      일식: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      양식: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      베트남: 'bg-green-500/20 text-green-300 border-green-500/30',
      태국: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      매움: 'bg-red-600/20 text-red-400 border-red-600/30',
      국물: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      면류: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      구이: 'bg-orange-600/20 text-orange-400 border-orange-600/30',
      튀김: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
    }
    return colorMap[tag] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  }

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-party flex items-center justify-center">
        <div className="text-2xl text-white">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-party relative overflow-hidden">
      <Sparkles />
      <Header />

      <div className="relative z-10 min-h-screen pt-20 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
              음식 추천하기
            </h1>
            {userName && (
              <p className="text-gray-400">
                안녕하세요, <span className="text-yellow-400 font-semibold">{userName}</span>님!
              </p>
            )}
          </motion.div>

          {/* 입력 폼 */}
          <motion.div
            className="glass-card rounded-2xl p-8 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">
                  먹고 싶은 음식을 추천해주세요!
                </label>
                <input
                  type="text"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="예: 마라샹궈, 삼겹살, 초밥..."
                  className="w-full px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all text-lg"
                  disabled={isSubmitting}
                />
              </div>

              {/* 생성된 태그 미리보기 */}
              <AnimatePresence>
                {tags.length > 0 && (
                  <motion.div
                    className="mb-6"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <p className="text-sm text-gray-400 mb-2">자동 생성된 태그:</p>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <motion.span
                          key={tag}
                          className={`px-3 py-1 rounded-full text-sm border ${getTagColor(tag)}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          {tag}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <motion.p
                  className="text-red-400 text-sm mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {error}
                </motion.p>
              )}

              {success && (
                <motion.div
                  className="mb-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-green-400 text-sm">{success}</p>
                  {bonusMessage && (
                    <p className="text-yellow-400 text-sm mt-1">{bonusMessage}</p>
                  )}
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={isSubmitting || !foodName.trim()}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-4 px-8 rounded-xl text-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? '추천 중...' : '추천하기'}
              </motion.button>
            </form>
          </motion.div>

          {/* 추천된 음식 목록 */}
          <motion.div
            className="glass-card rounded-2xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold mb-6 text-white">
              지금까지 추천된 음식 ({recommendations.length}개)
            </h2>

            {recommendations.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                아직 추천된 음식이 없어요. 첫 번째로 추천해주세요!
              </p>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <motion.div
                    key={rec.id}
                    className="bg-white/5 rounded-xl p-4 border border-white/10"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold text-white">{rec.foodName}</h3>
                      <span className="text-sm text-gray-400">{rec.userName}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {rec.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`px-2 py-0.5 rounded-full text-xs border ${getTagColor(tag)}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* 네비게이션 */}
          <motion.div
            className="flex justify-center gap-6 mt-8 pb-safe"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <a
              href="/"
              className="text-gray-400 hover:text-yellow-400 transition-colors"
            >
              ← 메인으로
            </a>
            <a
              href="/lottery"
              className="text-gray-400 hover:text-yellow-400 transition-colors"
            >
              제비뽑기 →
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
