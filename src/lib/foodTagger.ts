import { FOOD_TAG_MAP, DEFAULT_TAGS } from './constants'

// 음식 이름을 정규화하는 함수
function normalizeFoodName(foodName: string): string {
  return foodName
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
}

// 유사도 점수를 계산하는 함수 (레벤슈타인 거리 기반)
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeFoodName(str1)
  const s2 = normalizeFoodName(str2)

  if (s1 === s2) return 1
  if (s1.includes(s2) || s2.includes(s1)) return 0.8

  const len1 = s1.length
  const len2 = s2.length
  const matrix: number[][] = []

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }

  const maxLen = Math.max(len1, len2)
  return maxLen === 0 ? 1 : 1 - matrix[len1][len2] / maxLen
}

// 음식 태그를 생성하는 함수
export function generateFoodTags(foodName: string): string[] {
  const normalizedName = normalizeFoodName(foodName)

  // 정확히 일치하는 경우
  for (const [key, tags] of Object.entries(FOOD_TAG_MAP)) {
    if (normalizeFoodName(key) === normalizedName) {
      return tags
    }
  }

  // 유사한 음식 찾기
  let bestMatch: { name: string; tags: string[]; similarity: number } | null = null

  for (const [key, tags] of Object.entries(FOOD_TAG_MAP)) {
    const similarity = calculateSimilarity(foodName, key)
    if (similarity > 0.5 && (!bestMatch || similarity > bestMatch.similarity)) {
      bestMatch = { name: key, tags, similarity }
    }
  }

  if (bestMatch) {
    return bestMatch.tags
  }

  // 키워드 기반 태그 생성
  const keywords: Record<string, string[]> = {
    '면': ['면류'],
    '밥': ['밥류'],
    '국': ['국물'],
    '찌개': ['국물', '한식'],
    '탕': ['국물', '한식'],
    '볶음': ['볶음', '한식'],
    '구이': ['구이'],
    '튀김': ['튀김'],
    '삼': ['삼', '돼지고기'],
    '치킨': ['치킨', '닭고기'],
    '피자': ['양식', '치즈'],
    '파스타': ['양식', '면류'],
    '스시': ['일식', '해산물'],
    '라멘': ['일식', '면류'],
    '마라': ['중식', '매움'],
    '쌀국수': ['베트남', '면류'],
  }

  const generatedTags: Set<string> = new Set()

  for (const [keyword, tags] of Object.entries(keywords)) {
    if (normalizedName.includes(keyword)) {
      tags.forEach(tag => generatedTags.add(tag))
    }
  }

  if (generatedTags.size > 0) {
    return Array.from(generatedTags)
  }

  return DEFAULT_TAGS
}

// 두 음식이 동일한지 비교하는 함수
export function isSameFood(food1: string, food2: string): boolean {
  const similarity = calculateSimilarity(food1, food2)
  return similarity >= 0.8
}

// 기존 음식 목록에서 유사한 음식을 찾는 함수
export function findSimilarFood(
  foodName: string,
  existingFoods: string[]
): string | null {
  for (const existing of existingFoods) {
    if (isSameFood(foodName, existing)) {
      return existing
    }
  }
  return null
}
