'use client'

import { motion } from 'framer-motion'

export function SkeletonCard() {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10 animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="h-6 bg-white/10 rounded w-32" />
        <div className="h-4 bg-white/10 rounded w-16" />
      </div>
      <div className="flex gap-2">
        <div className="h-5 bg-white/10 rounded-full w-12" />
        <div className="h-5 bg-white/10 rounded-full w-16" />
        <div className="h-5 bg-white/10 rounded-full w-10" />
      </div>
    </div>
  )
}

export function SkeletonRankingCard() {
  return (
    <div className="relative overflow-hidden rounded-xl p-4 border border-white/10 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-white/10 rounded" />
          <div>
            <div className="h-5 bg-white/10 rounded w-24 mb-2" />
            <div className="h-4 bg-white/10 rounded w-32" />
          </div>
        </div>
        <div className="text-right">
          <div className="h-5 bg-white/10 rounded w-10 mb-2" />
          <div className="h-4 bg-white/10 rounded w-12" />
        </div>
      </div>
    </div>
  )
}

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <motion.div
      className={`${sizeClasses[size]} border-2 border-white/20 border-t-yellow-400 rounded-full`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  )
}

export function LoadingOverlay({ message = '로딩 중...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Spinner size="lg" />
      <p className="mt-4 text-gray-400">{message}</p>
    </div>
  )
}
