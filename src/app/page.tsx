'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Confetti from '@/components/Confetti'
import Sparkles from '@/components/Sparkles'
import { useUserStore } from '@/lib/store'
import { EVENT_INFO } from '@/lib/constants'

export default function Home() {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const router = useRouter()
  const { setUser, userName, userId } = useUserStore()

  // Hydration 완료 체크
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // 이미 로그인한 경우 바로 음식 추천 페이지로 이동
  useEffect(() => {
    if (isHydrated && userId && userName) {
      router.push('/recommend')
    }
  }, [isHydrated, userId, userName, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('이름을 입력해주세요!')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '오류가 발생했습니다')
      }

      setUser(data.id, data.name)
      router.push('/recommend')
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  // Hydration 전에는 로딩 표시
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-party flex items-center justify-center">
        <div className="text-2xl text-white">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-party relative overflow-hidden">
      <Confetti />
      <Sparkles />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pb-safe">
        <AnimatePresence mode="wait">
          {!showForm ? (
            <motion.div
              key="intro"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, y: -50 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              {/* 타이틀 */}
              <motion.h1
                className="text-5xl md:text-7xl font-bold gradient-text mb-8"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                GOODBYE 2025
              </motion.h1>

              {/* 서브타이틀 */}
              <motion.p
                className="text-xl md:text-2xl text-gray-300 mb-12"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                송년회에 초대합니다!
              </motion.p>

              {/* 이벤트 정보 카드 */}
              <motion.div
                className="glass-card rounded-2xl p-8 mb-12 max-w-md mx-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <motion.div
                  className="flex items-center justify-center gap-4 mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
                >
                  <span className="text-4xl">📅</span>
                  <div className="text-left">
                    <p className="text-sm text-gray-400">일시</p>
                    <p className="text-2xl font-bold text-yellow-400">{EVENT_INFO.displayDate}</p>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-center justify-center gap-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1, type: 'spring', stiffness: 200 }}
                >
                  <span className="text-4xl">📍</span>
                  <div className="text-left">
                    <p className="text-sm text-gray-400">장소</p>
                    <p className="text-2xl font-bold text-emerald-400">{EVENT_INFO.location}</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* 입장 버튼 */}
              <motion.button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-4 px-12 rounded-full text-xl btn-glow animate-pulse-glow transition-all hover:scale-105"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                입장하기
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md"
            >
              <motion.div
                className="glass-card rounded-2xl p-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.h2
                  className="text-3xl font-bold text-center mb-2 gradient-text"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  환영합니다!
                </motion.h2>
                <motion.p
                  className="text-gray-400 text-center mb-8"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  이름을 입력해주세요
                </motion.p>

                <form onSubmit={handleSubmit}>
                  <motion.div
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="닉네임 또는 이름"
                      className="w-full px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all text-lg"
                      disabled={isLoading}
                      autoFocus
                    />
                  </motion.div>

                  {error && (
                    <motion.p
                      className="text-red-400 text-sm mt-3 text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {error}
                    </motion.p>
                  )}

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-4 px-8 rounded-xl text-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? '입장 중...' : '입장하기'}
                  </motion.button>
                </form>

                <motion.button
                  onClick={() => setShowForm(false)}
                  className="w-full mt-4 text-gray-400 hover:text-white transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  ← 돌아가기
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 네비게이션 링크 */}
        <motion.div
          className="absolute bottom-8 flex gap-6 pb-safe"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
        >
          <a
            href="/recommend"
            className="text-gray-400 hover:text-yellow-400 transition-colors text-sm"
          >
            음식 추천하기 →
          </a>
          <a
            href="/lottery"
            className="text-gray-400 hover:text-yellow-400 transition-colors text-sm"
          >
            제비뽑기 →
          </a>
        </motion.div>
      </div>
    </div>
  )
}
