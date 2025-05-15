# 마비노기 경매장 분석 프로젝트

이 프로젝트는 마비노기 게임 내 경매장 아이템 가격을 분석하고 제작 손익을 계산해주는 웹 애플리케이션입니다.

## 목차

- [주요 기능](#주요-기능)
- [개발 환경 설정](#개발-환경-설정)
- [개발 가이드라인](#개발-가이드라인)
- [배포 방법](#배포-방법)
- [문제 해결 가이드](#문제-해결-가이드)

## 주요 기능

- 경매장 아이템 실시간 가격 정보 조회
- 제작 아이템의 손익 분석
- 5분마다 자동 데이터 갱신

## 개발 환경 설정

### 요구 사항

- **운영체제**: Windows 10 이상 (프로젝트는 Windows 환경에 최적화되어 있습니다)
- **Node.js**: 18.x 이상
- **npm**: 8.x 이상
- **Git**: 최신 버전 권장

### 개발 환경 설정하기

1. 프로젝트 클론
   ```bash
   git clone https://github.com/your-username/mabi-market.git
   cd mabi-market
   ```

2. 의존성 설치
   ```bash
   npm install
   ```

3. 개발 서버 실행
   ```bash
   npm run dev
   ```

4. 브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

### Windows 특화 안내

이 프로젝트는 Windows 환경에서 개발되었으며 다음 사항에 주의하세요:

1. **PowerShell 명령어**: 
   - 명령어 체이닝에 `&&` 대신 `;` 사용 권장
   - 예: `cd mabi-market; npm run dev`

2. **경로 표기법**:
   - Windows에서는 백슬래시(`\`)를 사용하지만, 코드 내에서는 슬래시(`/`)를 사용
   - 절대 경로를 사용할 때는 Windows 경로 형식 주의

3. **환경 변수**:
   - Windows에서 환경 변수를 설정할 때는 PowerShell에서 다음과 같이 설정
   ```powershell
   $env:NEXT_PUBLIC_VARIABLE_NAME="value"
   ```

## 개발 가이드라인

### 코드 스타일 및 규칙

#### TypeScript 규칙

1. **미사용 변수 방지**
   - 선언한 변수는 반드시 사용해야 합니다. 미사용 변수가 있으면 빌드 오류가 발생합니다.
   - 변수가 일시적으로 필요하지 않을 경우 다음과 같은 방법을 사용하세요:
     - 변수명 앞에 밑줄(_)을 추가: `const _unusedVar = 123;`
     - 주석으로 `// @ts-ignore` 또는 `/* eslint-disable @typescript-eslint/no-unused-vars */` 사용

2. **타입 정의**
   - 명시적인 타입 정의를 사용하세요.
   - 인터페이스와 타입은 의미 있는 이름을 사용하고 적절히 문서화하세요.

3. **에러 처리**
   - try/catch 블록에서 발생한 에러는 항상 로깅하고 적절히 처리하세요.
   - 사용자에게 친절한 오류 메시지를 표시하세요.

#### Next.js 서버 컴포넌트

1. **환경 변수**
   - 서버 컴포넌트에서는 `process.env.VARIABLE_NAME`만 사용할 수 있습니다.
   - 서버 컴포넌트와 함께 사용할 환경 변수는 `NEXT_PUBLIC_` 접두사 없이도 사용 가능합니다.

2. **데이터 가져오기**
   - 서버 컴포넌트에서 데이터를 가져올 때는 항상 오류 처리와 폴백 UI를 구현하세요.
   - 가능하면 정적 데이터나 샘플 데이터를 제공하여 서비스 가용성을 높이세요.

3. **클라이언트 컴포넌트 분리**
   - 상호작용이 필요한 UI 요소는 별도의 클라이언트 컴포넌트로 분리하세요.
   - 'use client' 지시어는 파일 최상단에 배치하세요.

### 코드 품질 유지 방법

코드를 커밋하거나 PR을 생성하기 전에 다음 명령어로 코드 품질을 확인하세요:

```bash
# 타입 체크 및 빌드
npm run build

# 린트 실행
npm run lint
```

#### ESLint 규칙 설정

프로젝트 루트의 `.eslintrc.json` 파일에서 필요한 경우 규칙을 설정할 수 있습니다:

```json
{
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { 
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_" 
    }]
  }
}
```

이 설정은 밑줄(_)로 시작하는 변수는 미사용 변수 검사에서 제외합니다.

## 배포 방법

이 프로젝트는 Vercel을 통해 자동으로 배포됩니다. GitHub 저장소에 변경사항을 푸시하면 다음과 같이 자동 배포가 진행됩니다:

1. **자동 배포 트리거**:
   - `main` 브랜치에 변경사항을 푸시하면 Vercel이 자동으로 감지하여 배포를 시작합니다.
   - Pull Request를 생성하면 Vercel이 자동으로 프리뷰 배포를 생성합니다.

2. **배포 프로세스**:
   - GitHub에 푸시 → Vercel이 변경 감지 → 빌드 프로세스 실행 → 배포 완료
   - 전체 배포 과정은 보통 2-5분 정도 소요됩니다.

3. **배포 후 확인**:
   - 배포가 완료되면 Vercel 대시보드 또는 GitHub PR에서 배포 상태와 URL을 확인할 수 있습니다.
   - 배포된 사이트에서 변경사항이 제대로 반영되었는지 확인하세요.

4. **배포 실패 시 대응**:
   - 배포가 실패한 경우, Vercel 대시보드에서 빌드 로그를 확인하세요.
   - 로컬에서 `npm run build`를 실행하여 동일한 오류가 발생하는지 테스트하세요.
   - 필요한 경우 환경 변수가 올바르게 설정되어 있는지 확인하세요.

배포 전에는 항상 로컬에서 빌드를 확인하고, 문제가 없는지 테스트하세요.

## 문제 해결 가이드

### 자주 발생하는 오류와 해결책

1. **'X is assigned a value but never used' 오류**
   - 해당 변수를 사용하세요.
   - 일시적으로 필요하지 않을 경우 변수명 앞에 밑줄을 추가하세요: `const _unusedVar = ...`
   - 변수가 필요 없다면 삭제하세요.

2. **'Cannot find module' 오류**
   - `npm install` 명령으로 의존성을 설치하세요.
   - 경로가 올바른지 확인하세요.
   - 해당 모듈의 타입 정의가 있는지 확인하세요.

### 중첩 폴더 구조 문제

프로젝트가 다음과 같은 중첩 폴더 구조를 가지고 있을 수 있습니다:
```
D:\mabiRPA\mabi-market\          <-- 실제 프로젝트 루트
└── mabi-market\                 <-- 중복 폴더
    ├── src\                     <-- 중복 폴더 내 소스 코드
    └── public\                  <-- 중복 폴더 내 정적 파일
```

이로 인한 문제를 해결하려면:

1. 항상 최상위 폴더에서 개발 서버를 실행하세요.
2. 필요하다면 중복 폴더를 백업 후 삭제하세요.

### API 및 데이터 연동 문제

#### API 응답 문제

실제 데이터베이스 연결을 위해서는 다음 사항을 확인하세요:

1. `.env.local` 파일에 올바른 Supabase 연결 정보가 있는지 확인:
   ```
   # Supabase 환경 변수
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here
   ```

2. 테스트 모드 비활성화 여부 확인
3. 데이터베이스 테이블 구조 확인

#### Supabase 데이터 연동 문제

Vercel에 배포된 웹사이트에서 Supabase 데이터 로딩에 문제가 발생할 경우:

1. **환경 변수 동기화**:
   - Vercel 대시보드에서 Supabase 통합 설정을 확인하세요.
   - 필요한 경우 Supabase 환경 변수를 수동으로 동기화하세요.

2. **IPv4/IPv6 호환성 문제**:
   - 2024년 1월 29일부터 Supabase는 IPv6로 마이그레이션하기 시작했으나, Vercel은 IPv6를 완전히 지원하지 않습니다.
   - 2024년 1월 27일 이후 배포를 하지 않은 경우 재배포하여 새 환경 변수가 적용되도록 하세요.

3. **연결 설정 개선**:
   ```typescript
   const supabase = createClient(supabaseUrl, supabaseKey, {
     auth: {
       persistSession: false,
       autoRefreshToken: false,
       detectSessionInUrl: false
     },
     global: {
       fetch: fetch,
       headers: { 
         'X-Client-Info': 'vercel-deployment'
       }
     },
     db: {
       schema: 'public'
     }
   });
   ```

4. **폴백 전략 구현**:
   - 메모리 캐시 활용
   - 기본 데이터 제공
   - 타임아웃 설정

### 브라우저 관련 문제

1. **변경사항이 적용되지 않는 경우**:
   - 브라우저 캐시를 지우거나 강력 새로고침(Ctrl+F5)을 시도하세요.
   - 개발자 도구의 네트워크 탭에서 "Disable cache" 옵션을 활성화하세요.

2. **CORS 문제**:
   - `next.config.ts` 파일에서 CORS 헤더를 추가하세요.
   ```javascript
   headers: async () => {
     return [
       {
         source: '/api/:path*',
         headers: [
           { key: 'Access-Control-Allow-Origin', value: '*' },
           { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
           { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
         ],
       },
     ];
   },
   ```

## 추가 리소스

- [Next.js 문서](https://nextjs.org/docs) - Next.js 기능 및 API에 대해 알아보세요.
- [Supabase 문서](https://supabase.io/docs) - Supabase 사용법에 대해 알아보세요.
- [Vercel 배포 문서](https://nextjs.org/docs/app/building-your-application/deploying) - 배포에 대한 자세한 정보입니다.
