# Goodbye 2025 - 음식 추첨 앱

2025년 송년회를 위한 음식 추천 및 랜덤 추첨 웹 애플리케이션

## 주요 기능

### 음식 추천
- 사용자별 원하는 음식 추천
- 유사한 음식명 자동 그룹화 (예: "궁중떡볶이" ≈ "궁중 떡볶이")
- 자동 태그 분류 (#한식, #중식, #구이 등)

### 좋아요/싫어요 투표
- 추천된 음식에 투표 가능
- 사용자당 음식별 1표 제한
- 토글 방식 (다시 클릭시 취소)

### 랜덤 추첨
- 추천수 + 투표 기반 가중치 적용
- 추천 많을수록, 좋아요 많을수록 당첨 확률 상승
- 싫어요는 확률 감소 (최소 0.1 보장)

### 실시간 업데이트
- 10초 간격 폴링
- 탭 비활성시 폴링 중지 (리소스 최적화)
- 탭 활성화시 즉시 새로고침

## 기술 스택

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Animation**: Framer Motion
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **State**: Zustand
- **Deployment**: Vercel

## 시작하기

### 환경 변수 설정

```bash
# .env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

### 설치 및 실행

```bash
# 의존성 설치
pnpm install

# DB 마이그레이션
pnpm db:push

# 개발 서버 실행
pnpm dev
```

### 빌드

```bash
pnpm build
```

## 프로젝트 구조

```
src/
├── app/
│   ├── api/
│   │   ├── lottery/          # 추첨 API
│   │   ├── recommendations/  # 음식 추천 API
│   │   ├── user/             # 사용자 API
│   │   └── vote/             # 투표 API
│   ├── lottery/              # 추첨 페이지
│   ├── recommend/            # 추천 페이지
│   └── layout.tsx
├── lib/
│   ├── foodTagger.ts         # 음식 태그 & 유사도 계산
│   └── prisma.ts             # Prisma 클라이언트
└── stores/
    └── userStore.ts          # 사용자 상태 관리
```

## 데이터 모델

```prisma
model User {
  id                  String   @id @default(cuid())
  name                String
  foodRecommendations FoodRecommendation[]
  votes               FoodVote[]
}

model FoodRecommendation {
  id        String   @id @default(cuid())
  foodName  String
  tags      String[]
  userId    String
  user      User     @relation(...)
}

model FoodVote {
  id        String   @id @default(cuid())
  foodName  String
  voteType  String   // "like" | "dislike"
  userId    String
  user      User     @relation(...)
  @@unique([foodName, userId])
}

model LotteryResult {
  id         String   @id @default(cuid())
  foodName   String
  drawnAt    DateTime @default(now())
}
```

## 추첨 가중치 공식

```
weight = max(0.1, baseWeight + recommendBonus + likeBonus - dislikePenalty)

- baseWeight: 추천수
- recommendBonus: 추천수^1.5
- likeBonus: 좋아요 × 0.5
- dislikePenalty: 싫어요 × 0.3
```
