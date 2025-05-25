# Vercel 배포 시 Supabase 연결 문제 해결 가이드

## 문제 상황
개발 서버에서는 정상 작동하지만 Vercel 배포 환경에서 Supabase 데이터를 가져오지 못하는 경우

## 주요 원인 및 해결책

### 1. 환경 변수 설정 문제

#### 확인 방법
```bash
# 디버그 API로 환경 변수 상태 확인
curl https://your-app.vercel.app/api/debug
```

#### 해결책
1. **Vercel 대시보드에서 환경 변수 확인**
   - Project Settings → Environment Variables
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://your-project-id.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 프로젝트의 anon key

2. **환경 변수 재배포**
   ```bash
   # Vercel CLI 사용 시
   vercel env pull .env.local
   vercel --prod
   ```

### 2. IPv6 호환성 문제 (2024년 이후)

#### 문제
- Supabase가 IPv6로 마이그레이션
- Vercel의 IPv6 지원 제한

#### 해결책
1. **프로젝트 재배포**
   ```bash
   git commit --allow-empty -m "Force redeploy for IPv6 compatibility"
   git push origin main
   ```

2. **Supabase 연결 설정 개선** (이미 적용됨)
   - 타임아웃 설정
   - 재시도 로직
   - 폴백 데이터 제공

### 3. Edge Runtime 호환성

#### 문제
- Supabase 클라이언트와 Edge Runtime 충돌

#### 해결책 (이미 적용됨)
```typescript
// next.config.ts
experimental: {
  serverComponentsExternalPackages: ['@supabase/supabase-js'],
}
```

### 4. 데이터베이스 접근 권한

#### 확인 방법
1. **Supabase 대시보드에서 RLS 정책 확인**
   - Table Editor → auction_list 테이블
   - Authentication → Policies

2. **테이블 존재 여부 확인**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'auction_list';
   ```

#### 해결책
1. **RLS 정책 설정**
   ```sql
   -- 읽기 권한 허용
   CREATE POLICY "Allow public read access" ON auction_list
   FOR SELECT USING (true);
   ```

2. **테이블 생성 (필요한 경우)**
   ```sql
   CREATE TABLE auction_list (
     id SERIAL PRIMARY KEY,
     item_name TEXT NOT NULL,
     auction_price_per_unit INTEGER NOT NULL,
     item_count INTEGER NOT NULL,
     collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

### 5. 네트워크 및 지역 설정

#### 문제
- Supabase와 Vercel 서버 간 지역 차이로 인한 지연

#### 해결책
1. **Supabase 프로젝트 지역 확인**
   - Supabase 대시보드 → Settings → General
   - 가능하면 아시아 태평양 지역 선택

2. **Vercel 배포 지역 설정**
   ```json
   // vercel.json
   {
     "regions": ["icn1", "nrt1"]
   }
   ```

## 배포 후 확인 사항

### 1. 디버그 API 확인
```bash
curl https://your-app.vercel.app/api/debug
```

예상 응답:
```json
{
  "status": "success",
  "connection": {
    "status": "success",
    "dataExists": true,
    "queryTime": 150
  },
  "recommendations": [
    "모든 연결이 정상입니다."
  ]
}
```

### 2. 실제 데이터 API 테스트
```bash
curl "https://your-app.vercel.app/api/items/price?itemName=돌연변이 토끼의 발"
```

### 3. 브라우저 개발자 도구 확인
- Network 탭에서 API 응답 상태 확인
- Console에서 오류 메시지 확인

## 폴백 전략 (이미 구현됨)

현재 구현된 폴백 전략:
1. **메모리 캐시**: 1시간 동안 성공한 응답 캐시
2. **기본 데이터**: 주요 아이템에 대한 기본 가격 정보
3. **단계별 폴백**: 환경 변수 → 연결 오류 → 데이터 없음 → 예외 처리

## 모니터링

### Vercel 로그 확인
```bash
vercel logs --follow
```

### 주요 로그 메시지
- `=== 환경 변수 상태 확인 ===`: 환경 변수 상태
- `Supabase 쿼리 시작`: 데이터베이스 쿼리 시작
- `폴백 데이터 사용`: 폴백 데이터 사용됨

## 추가 최적화

### 1. 캐시 전략
- API 응답에 적절한 Cache-Control 헤더 설정
- CDN 캐시 활용

### 2. 성능 모니터링
- 쿼리 응답 시간 모니터링
- 오류율 추적

### 3. 알림 설정
- Vercel 배포 실패 알림
- Supabase 서비스 상태 모니터링

## 문의 및 지원

문제가 지속될 경우:
1. Vercel 지원팀 문의
2. Supabase 커뮤니티 포럼
3. 프로젝트 이슈 트래커 