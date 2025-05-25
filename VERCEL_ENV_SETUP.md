# Vercel 환경 변수 설정 가이드

## 문제 상황
현재 Vercel 배포에서 PostgreSQL URL이 REST API URL 대신 사용되고 있어 연결에 실패하고 있습니다.

## 해결 방법

### 1. Vercel 대시보드에서 환경 변수 수정

1. [Vercel 대시보드](https://vercel.com/dashboard)에 접속
2. `mabi_market` 프로젝트 선택
3. Settings → Environment Variables 메뉴로 이동
4. 기존 환경 변수를 다음과 같이 수정:

```
NEXT_PUBLIC_SUPABASE_URL=https://hwskpyhrkbxuivdbqgrk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[실제 anon key 값]
```

### 2. 올바른 URL 형식 확인

- ❌ 잘못된 형식: `postgresql://postgres.hwskpyhrkbxuivdbqgrk:...`
- ✅ 올바른 형식: `https://hwskpyhrkbxuivdbqgrk.supabase.co`

### 3. Supabase 대시보드에서 올바른 값 확인

1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. Settings → API 메뉴로 이동
4. 다음 값들을 복사:
   - **Project URL**: `https://hwskpyhrkbxuivdbqgrk.supabase.co`
   - **anon public key**: `eyJ...` (긴 JWT 토큰)

### 4. 환경 변수 적용 범위 설정

Vercel에서 환경 변수를 설정할 때 다음 환경에 모두 적용:
- ✅ Production
- ✅ Preview  
- ✅ Development

### 5. 재배포

환경 변수 변경 후 반드시 재배포 필요:
1. Vercel 대시보드에서 Deployments 탭으로 이동
2. 최신 배포의 "..." 메뉴 클릭
3. "Redeploy" 선택

## 확인 방법

배포 완료 후 다음 URL로 연결 상태 확인:
```
https://your-domain.vercel.app/api/debug
```

## 추가 문제 해결

### IPv6 호환성 문제
2024년 1월 27일 이후 배포하지 않은 경우:
1. 새로운 커밋을 푸시하여 재배포
2. 또는 Vercel 대시보드에서 수동 재배포

### 연결 타임아웃 문제
- Supabase 프로젝트가 일시 정지된 경우 활성화 필요
- 무료 플랜의 경우 7일 비활성 후 자동 일시 정지

## 로컬 개발 환경 설정

로컬에서 테스트하려면 `.env.local` 파일 생성:
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://hwskpyhrkbxuivdbqgrk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[실제 anon key 값]
```

## 보안 주의사항

- `anon key`는 공개되어도 안전하지만 GitHub에 커밋하지 마세요
- `service_role key`는 절대 클라이언트에서 사용하지 마세요
- 환경 변수 파일(`.env*`)은 `.gitignore`에 포함되어 있는지 확인하세요 