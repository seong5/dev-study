# 전역 에러 처리 방법

> 관련 노트: [인증/인가 : 401/403 처리](../auth/authentication-authorization.md)

에러는 계층별로 나눠서 처리한다.

## 1. API 요청 계층 - `Axios` 인터셉터

- 에러를 가장 먼저 만나는 곳. 모든 API 요청이 인터셉터를 거침
- 공통으로 처리할 일을 인터셉터에서 해결
- 에러 코드별로 분류
  - 401 → 토큰 재발급
  - 403 → 권한 없음 안내
  - 5xx → 서버 에러
- 서버마다 다른 에러 응답을 정해진 형태로 바꾼 후 전달

## 2. 서버 상태 계층 - `TanStack Query`

- `QueryCache`와 `MutationCache`에 전역 에러 핸들러 설정
- 어떤 요청이든 실패하면 공통 알림으로 보여줄 수 있음
- 400번대 에러는 재시도해도 결과가 같으니 재시도에서 제외
  - 단, `408`(요청 시간 초과)과 `429`(요청 과다)는 잠시 후 다시 보내면 성공할 수 있어 예외

## 3. 렌더링 계층 - `Error Boundary`

- `Error Boundary`로 감싸서 에러가 난 영역만 대체 화면으로 바꾸고 나머지는 정상 렌더링
- 보통 전체를 감싸는 큰 `Error Boundary`를 두고, 위젯이나 섹션별로 작은 바운더리를 생성
- 대체 화면에는 `"다시 시도"` 같은 버튼을 둬서 사용자가 직접 복구하도록 함
- `Error Boundary`는 렌더링 중에 발생한 에러만 잡음. 이벤트 핸들러나 비동기 코드의 에러는 잡지 못함
  - API 에러를 바운더리로 보내려면 `TanStack Query`의 `throwOnError` 옵션을 사용

## 4. 라우트 계층 - `Next.js App Router`

- `Next.js`는 파일 이름 규칙으로 에러 처리 화면을 제공
- `error.tsx`는 해당 라우트를 감싸는 `Error Boundary` 역할
  - 라우트마다 `error.tsx`를 둘 수 있음
  - 클라이언트 컴포넌트여야 하므로 `'use client'` 필수
- 가장 바깥인 `Root Layout`에서 발생한 에러는 `global-error.tsx`로 잡음
  - `Root Layout`을 대체하므로 `<html>`, `<body>` 태그를 직접 포함해야 함
- 존재하지 않는 페이지는 `not-found.tsx`로 404 처리
