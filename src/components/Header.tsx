'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/lib/store'
import { useRouter } from 'next/navigation'

export default function Header() {
  const { userName, clearUser } = useUserStore()
  const [showMenu, setShowMenu] = useState(false)
  const router = useRouter()

  const handleSwitchUser = () => {
    clearUser()
    setShowMenu(false)
    router.push('/')
  }

  if (!userName) return null

  return (
    <div
      className="sticky top-0 left-0 right-0 z-50 backdrop-blur-md"
      style={{ backgroundColor: 'rgba(26, 26, 46, 0.9)' }}
    >
      <div className="flex justify-between items-center py-3 px-4">
        <a href="/" className="text-lg font-bold gradient-text">
          GOODBYE 2025
        </a>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all"
          >
            <span className="text-sm text-gray-300">👋</span>
            <span className="text-sm font-medium text-white">{userName}</span>
            <span className="text-xs text-gray-400">▼</span>
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <motion.div
                  className="fixed inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  className="absolute right-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-xl overflow-hidden"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-xs text-gray-400">현재 참여자</p>
                    <p className="text-sm font-semibold text-white">{userName}</p>
                  </div>
                  <button
                    onClick={handleSwitchUser}
                    className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2"
                  >
                    <span>🔄</span>
                    <span>다른 이름으로 참여</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
