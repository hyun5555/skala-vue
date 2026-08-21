# Vue.js 2일차

# 과제1: 날씨 Mockup 추가 구현 사항

과제의 기본 요구사항 외에 직접 추가한 데이터와 기능을 정리했습니다.

## 추가 데이터

- 기존 서울·수원·부산 외에 제주·대전·광주 데이터를 추가했습니다.
- 도시별 날씨 아이콘(`emoji`)을 추가해 상태를 빠르게 구분할 수 있도록 했습니다.
- 기온과 날씨 상태 외에 습도(`humidity`)와 풍속(`wind`)을 카드에 표시했습니다.
- 기온 구간을 더움·선선함·추움의 세 단계로 확장했습니다.

## 추가 기능

- 입력한 한글이 포함된 도시만 카드 목록에 표시되는 부분 일치 검색을 구현했습니다.
- 현재 검색 결과 개수를 검색 영역에 표시했습니다.
- 초기화 버튼으로 검색어와 카드 목록을 한 번에 원래 상태로 되돌릴 수 있습니다.
- 검색 결과가 없을 때 `일치하는 도시가 없습니다.` 안내 문구를 표시합니다.
- 카드에 키보드 포커스를 지원하고 Enter 또는 Space 키로 도시를 선택할 수 있습니다.

## Mockup UI

- 검색 영역, 날씨 목록, 상태바를 구분된 카드 형태로 구성했습니다.
- 날씨 카드에 아이콘, 기온, 습도, 풍속, 기온별 색상 배지를 배치했습니다.
- 카드 hover·focus 효과와 모바일 반응형 레이아웃을 적용했습니다.
- 데스크톱 화면에서는 최대 1100px 너비를 사용하도록 확장했습니다.
- 컴포넌트 전용 스타일은 `WeatherMockup.vue`의 `<style scoped>`에 작성했습니다.

## 구현 파일

- `src/components/practices/handson/WeatherMockup.vue`
- `src/App.vue`

# Vue.js 3일차

# 과제2: 날씨 Composition API 진행 사항

`WeatherComposition.vue`에 Composition API를 적용하고, 검색된 날씨 데이터를 활용하는 기능을 추가했습니다.

## 과제 2 기본 구현

- `searchQuery`, `selectedCityInfo`를 `ref`로 정의해 검색어와 상태바 문구를 반응형으로 관리했습니다.
- `filteredWeatherList` computed로 검색어가 비었을 때는 전체 도시를, 검색어가 있을 때는 일치하는 도시만 표시했습니다.
- 일치하는 도시가 없으면 `검색 결과와 일치하는 도시가 없습니다.` 문구를 표시했습니다.
- `watch(selectedCityInfo)`로 상태바 변경을, `watchEffect()`로 검색어 변경을 콘솔에 기록했습니다.
- 도시 카드를 마우스나 Enter·Space 키로 선택할 수 있게 구현했습니다.

## 직접 추가한 기능

### 검색 결과 외출 지수

- 검색된 도시들의 평균 기온·습도·풍속을 computed로 계산했습니다.
- 기온, 습도, 풍속, 비·눈 여부를 반영해 100점 기준의 `오늘의 외출 지수`를 도출했습니다.
- 외출 지수에 따라 외출하기 좋음, 무난함, 실내 일정 추천으로 상태를 안내합니다.
- 날씨에 따라 우산, 따뜻한 외투, 선크림과 물, 바람막이, 편한 신발 중 필요한 준비물을 추천합니다.
- `bestCity` computed로 현재 검색 결과 중 외출 지수가 가장 높은 도시를 추천합니다.
- `showOutingIndex`로 전체 외출 지수 표시 여부를 관리하고, `watch(outingIndex)`로 점수 변화를 추적했습니다.

### 도시별 상세 외출 지수

- `상세보기`를 누르면 기존 날씨 alert을 표시한 뒤, 해당 도시 카드 하단에 외출 지수와 추천 준비물을 표시합니다.
- `expandedCityId`로 상세 정보를 표시할 도시를 반응형으로 관리했습니다.
- 전체 평균과 각 도시가 동일한 `calculateOutingIndex`, `getOutingGuide`, `getItemToBring` 함수를 사용하도록 구성했습니다.

### 강아지 산책 지수

- `calculateDogWalkIndex` 함수가 도시의 기온, 습도, 풍속, 비·눈 여부를 반영해 0~100점의 산책 지수를 계산합니다.
- 선택한 도시가 없으면 `bestDogWalkCity` computed가 검색 결과 중 산책 지수가 가장 높은 도시를 자동으로 선택합니다.
- 날씨 카드를 클릭하면 `selectedCityId`에 도시 ID를 저장하고, `dogWalkTargetCity` computed가 해당 도시의 산책 지수를 표시합니다.
- `추천 도시로 돌아가기`를 누르면 도시 선택을 해제하고 다시 최고 추천 도시를 표시합니다.
- `walkTimeSlot` 반응형 변수로 아침·오후·저녁 중 희망 시간대를 선택하고, `recommendedWalkTime` computed가 선택 도시의 기온과 강수 여부에 맞는 산책 시간을 안내합니다.
- 시간대별 실제 예보 데이터가 없으므로 현재 기온을 기준으로 추천하며, 향후 예보 API 연동 시 실제 시간별 기온으로 교체할 수 있습니다.
- `watch(dogWalkIndex)`와 `watch(walkTimeSlot)`로 산책 지수와 시간대 변경을 콘솔에 기록합니다.
- 강아지 산책 정보는 날씨 카드 목록 아래의 독립된 반응형 UI에 표시합니다.

## UI 및 반응형 처리

- `WeatherMockup.vue`와 동일한 화면 너비, 카드, 검색 영역 스타일을 적용했습니다.
- 560px 이하에서 검색 컨트롤과 날씨 카드가 세로로 배치되도록 반응형 레이아웃을 적용했습니다.

## 구현 파일

- `src/components/practices/handson/WeatherComposition.vue`
- `src/App.vue`

# 과제3: 날씨 Component 분리

`WeatherComposition.vue`의 기능은 유지하면서 부모·자식 통신과 slot을 사용하는 컴포넌트 구조로 분리했습니다.

## 컴포넌트 구조

### `WeatherParent.vue`

- 날씨 목록, 검색어, 선택 도시, 상세 표시, 외출 지수, 산책 시간대 등 모든 반응형 데이터를 관리합니다.
- 검색 결과, 평균 날씨, 외출 지수, 추천 도시, 강아지 산책 지수를 computed로 계산합니다.
- 자식 컴포넌트에 props를 전달하고 emits 이벤트를 받아 상태를 변경합니다.

### `BaseDashboardCard.vue`

- 도시 검색과 날씨 목록의 공통 카드 디자인을 담당합니다.
- `<slot />`을 사용해 부모가 `SearchBar`와 `WeatheCard` 목록을 주입합니다.

### `SearchBar.vue`

- `query`, `showOutingIndex` props로 부모의 검색어와 외출 지수 표시 상태를 받습니다.
- 검색어 입력·초기화 시 `update-query`, 외출 지수 버튼 클릭 시 `toggle-outing` 이벤트를 발생시킵니다.

### `WeatheCard.vue`

- `city` props로 도시 객체를 받아 날씨 정보와 상세 외출 지수를 표시합니다.
- 카드 선택 시 `select-card`, 상세보기 클릭 시 `click-detail` 이벤트와 도시 객체를 부모에 전달합니다.
- 마우스 클릭과 Enter·Space 키로 도시를 선택할 수 있습니다.

## 창의적 추가 Component

### `DogWalkGuide.vue`

- 선택 도시나 최고 추천 도시의 강아지 산책 지수를 독립 UI로 표시합니다.
- `city`, `score`, `guide`, `selected`, `timeSlot`, `recommendedTime` props를 받습니다.
- 시간대 변경 시 `update-time-slot`, 추천 도시 복귀 시 `reset-city` 이벤트를 부모에 전달합니다.

## 스타일 분리

- 공통 대시보드 카드, 검색바, 날씨 카드, 강아지 산책 가이드의 스타일을 각 컴포넌트의 `<style scoped>`로 분리했습니다.
- `WeatherParent.vue`에는 외출 리포트와 상태바처럼 부모가 직접 렌더링하는 영역의 스타일만 두었습니다.

## 구현 파일

- `src/components/practices/handson/weather-components/WeatherParent.vue`
- `src/components/practices/handson/weather-components/BaseDashboardCard.vue`
- `src/components/practices/handson/weather-components/SearchBar.vue`
- `src/components/practices/handson/weather-components/WeatheCard.vue`
- `src/components/practices/handson/weather-components/DogWalkGuide.vue`
- `src/App.vue`

# Vue.js 4일차

# 과제4: Weather Router 적용

기존 `WeatherParent`와 분리된 날씨 컴포넌트를 Vue Router 기반의 페이지 구조로 전환했습니다.

## 과제 요구사항 수행 확인

| 요구사항 | 구현 내용 | 완료 |
| --- | --- | :---: |
| Vue Router 설정 | `main.js`에서 `app.use(router)`로 라우터를 전역 등록했습니다. | ✅ |
| 라우터 지연 로딩 | 모든 View를 `() => import(...)` 방식으로 불러오도록 구성했습니다. | ✅ |
| Catch-all Route | `/:pathMatch(.*)*` 경로를 `NotFoundView`와 연결했습니다. | ✅ |
| App.vue 구성 | `RouterLink` 내비게이션 바와 메인 콘텐츠 영역의 `RouterView`를 배치했습니다. | ✅ |
| WeatherHomeView | `/` 경로에서 기존 `WeatherParent`와 날씨 하위 컴포넌트를 재사용하도록 작성했습니다. | ✅ |
| Programmatic Navigation | 상세보기의 `window.alert()`를 제거하고 `router.push('/weather/' + city.id)`로 이동하도록 변경했습니다. | ✅ |
| 동적 상세 경로 | `/weather/:cityId`로 도시 ID를 전달하고 상세 화면을 표시합니다. | ✅ |
| 상세 Mock Data | Mount 시점에 `route.params.cityId`로 6개 도시 Mock Data 중 해당 도시를 선택합니다. | ✅ |
| WeatherAboutView | 서비스 소개와 메인 대시보드 복귀 링크를 작성했습니다. | ✅ |
| 추가 View | `WeatherTipsView`를 `/tips` 경로에 연결했습니다. | ✅ |

## 라우팅 구조

| 경로 | View | 역할 |
| --- | --- | --- |
| `/` | `WeatherHomeView.vue` | 날씨 검색 및 지역별 대시보드 |
| `/weather/:cityId` | `WeatherDetailView.vue` | 도시 ID에 해당하는 상세 기상관측 정보 |
| `/about` | `WeatherAboutView.vue` | 서비스 소개 |
| `/tips` | `WeatherTipsView.vue` | 날씨별 생활 팁을 제공하는 추가 화면 |
| `/:pathMatch(.*)*` | `NotFoundView.vue` | 정의되지 않은 경로의 404 안내 |

## 추가 확장 기능

### 기존 대시보드 기능 유지

- Router가 적용된 후에도 도시 검색, 검색 초기화, 카드 선택, 외출 지수 표시 기능을 그대로 사용할 수 있습니다.
- 검색 결과의 평균 기온·습도·풍속과 강수 여부를 반영한 외출 리포트를 제공합니다.
- 선택 도시 또는 추천 도시를 기준으로 강아지 산책 지수와 아침·오후·저녁 추천 시간을 안내합니다.
- 서울·수원·부산 외에 제주·대전·광주를 포함한 6개 도시를 상세 경로에서 조회할 수 있습니다.

### 상세 및 예외 처리

- 상세 화면에서 도시명, 날씨 아이콘, 상태, 기온, 습도, 풍속을 한 번에 표시합니다.
- 존재하지 않는 `cityId`로 접근하면 빈 화면 대신 `도시 코드에 해당하는 기상 정보가 없습니다.` 문구를 표시합니다.
- 존재하지 않는 URL은 Catch-all Route가 처리하며 날씨 메인으로 돌아가는 링크를 제공합니다.

### 내비게이션 및 UI

- 현재 경로의 메뉴에 `router-link-exact-active` 스타일을 적용해 활성 화면을 구분합니다.
- 상세·소개·팁·404 화면에 `RouterLink` 기반의 메인 복귀 동선을 제공합니다.
- 내비게이션과 기존 날씨 카드·검색 영역에 모바일 반응형 레이아웃을 적용했습니다.
- 내비게이션에 `aria-label`을 지정하고 기존 카드의 키보드 선택 및 상태 안내 접근성을 유지했습니다.

## 구현 파일

- `src/main.js`
- `src/router/index.js`
- `src/App.vue`
- `src/views/WeatherHomeView.vue`
- `src/views/WeatherDetailView.vue`
- `src/views/WeatherAboutView.vue`
- `src/views/WeatherTipsView.vue`
- `src/views/NotFoundView.vue`
- `src/components/practices/handson/weather-components/WeatherParent.vue`

## 실행 및 확인

```sh
npm install
npm run dev
```

- `npm run build`로 전체 View의 지연 로딩 청크 생성을 확인했습니다.
- 브라우저에서 홈 → 서울 상세(`/weather/city_01`) 이동 시 alert 없이 상세 화면이 표시되는 것을 확인했습니다.
- `/about`, `/tips`, 정의되지 않은 경로의 렌더링과 브라우저 오류가 없음을 확인했습니다.
