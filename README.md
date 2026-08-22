# Vue.js 2일차

# 과제1: 날씨 Mockup 추가 구현 사항

## 추가 데이터

- 기존 서울·수원·부산 외에 제주·대전·광주 데이터를 추가했다.
- 도시별 날씨 아이콘(`emoji`)을 추가해 상태를 빠르게 구분할 수 있도록 했다.
- 기온과 날씨 상태 외에 습도(`humidity`)와 풍속(`wind`)을 카드에 표시했다.
- 기온 구간을 더움·선선함·추움의 세 단계로 확장했다.

## 추가 기능

- 입력한 한글이 포함된 도시만 카드 목록에 표시되는 부분 일치 검색을 구현했다.
- 현재 검색 결과 개수를 검색 영역에 표시했다.
- 초기화 버튼으로 검색어와 카드 목록을 한 번에 원래 상태로 되돌릴 수 있다.
- 검색 결과가 없을 때 `일치하는 도시가 없다.` 안내 문구를 표시한다.
- 카드에 키보드 포커스를 지원하고 Enter 또는 Space 키로 도시를 선택할 수 있다.

## Mockup UI

- 검색 영역, 날씨 목록, 상태바를 구분된 카드 형태로 구성했다.
- 날씨 카드에 아이콘, 기온, 습도, 풍속, 기온별 색상 배지를 배치했다.
- 카드 hover·focus 효과와 모바일 반응형 레이아웃을 적용했다.
- 데스크톱 화면에서는 최대 1100px 너비를 사용하도록 확장했다.
- 컴포넌트 전용 스타일은 `WeatherMockup.vue`의 `<style scoped>`에 작성했다.

# Vue.js 3일차

# 과제2: 날씨 Composition API 진행 사항

`WeatherComposition.vue`에 Composition API를 적용하고, 검색된 날씨 데이터를 활용하는 기능을 추가했다.

## 과제 2 기본 구현

- `searchQuery`, `selectedCityInfo`를 `ref`로 정의해 검색어와 상태바 문구를 반응형으로 관리했다.
- `filteredWeatherList` computed로 검색어가 비었을 때는 전체 도시를, 검색어가 있을 때는 일치하는 도시만 표시했다.
- 일치하는 도시가 없으면 `검색 결과와 일치하는 도시가 없다.` 문구를 표시했다.
- `watch(selectedCityInfo)`로 상태바 변경을, `watchEffect()`로 검색어 변경을 콘솔에 기록했다.
- 도시 카드를 마우스나 Enter·Space 키로 선택할 수 있게 구현했다.

## 직접 추가한 기능

### 검색 결과 외출 지수

- 검색된 도시들의 평균 기온·습도·풍속을 computed로 계산했다.
- 기온, 습도, 풍속, 비·눈 여부를 반영해 100점 기준의 `오늘의 외출 지수`를 도출했다.
- 외출 지수에 따라 외출하기 좋음, 무난함, 실내 일정 추천으로 상태를 안내한다.
- 날씨에 따라 우산, 따뜻한 외투, 선크림과 물, 바람막이, 편한 신발 중 필요한 준비물을 추천한다.
- `bestCity` computed로 현재 검색 결과 중 외출 지수가 가장 높은 도시를 추천한다.
- `showOutingIndex`로 전체 외출 지수 표시 여부를 관리하고, `watch(outingIndex)`로 점수 변화를 추적했다.

### 도시별 상세 외출 지수

- `상세보기`를 누르면 기존 날씨 alert을 표시한 뒤, 해당 도시 카드 하단에 외출 지수와 추천 준비물을 표시한다.
- `expandedCityId`로 상세 정보를 표시할 도시를 반응형으로 관리했다.
- 전체 평균과 각 도시가 동일한 `calculateOutingIndex`, `getOutingGuide`, `getItemToBring` 함수를 사용하도록 구성했다.

### 강아지 산책 지수

- `calculateDogWalkIndex` 함수가 도시의 기온, 습도, 풍속, 비·눈 여부를 반영해 0~100점의 산책 지수를 계산한다.
- 선택한 도시가 없으면 `bestDogWalkCity` computed가 검색 결과 중 산책 지수가 가장 높은 도시를 자동으로 선택한다.
- 날씨 카드를 클릭하면 `selectedCityId`에 도시 ID를 저장하고, `dogWalkTargetCity` computed가 해당 도시의 산책 지수를 표시한다.
- `추천 도시로 돌아가기`를 누르면 도시 선택을 해제하고 다시 최고 추천 도시를 표시한다.
- `walkTimeSlot` 반응형 변수로 아침·오후·저녁 중 희망 시간대를 선택하고, `recommendedWalkTime` computed가 선택 도시의 기온과 강수 여부에 맞는 산책 시간을 안내한다.
- 시간대별 실제 예보 데이터가 없으므로 현재 기온을 기준으로 추천하며, 향후 예보 API 연동 시 실제 시간별 기온으로 교체할 수 있다.
- `watch(dogWalkIndex)`와 `watch(walkTimeSlot)`로 산책 지수와 시간대 변경을 콘솔에 기록한다.
- 강아지 산책 정보는 날씨 카드 목록 아래의 독립된 반응형 UI에 표시한다.

## UI 및 반응형 처리

- `WeatherMockup.vue`와 동일한 화면 너비, 카드, 검색 영역 스타일을 적용했다.
- 560px 이하에서 검색 컨트롤과 날씨 카드가 세로로 배치되도록 반응형 레이아웃을 적용했다.

# 과제3: 날씨 Component 분리

`WeatherComposition.vue`의 기능은 유지하면서 부모·자식 통신과 slot을 사용하는 컴포넌트 구조로 분리했다.

## 컴포넌트 구조

### `WeatherParent.vue`

- 날씨 목록, 검색어, 선택 도시, 상세 표시, 외출 지수, 산책 시간대 등 모든 반응형 데이터를 관리한다.
- 검색 결과, 평균 날씨, 외출 지수, 추천 도시, 강아지 산책 지수를 computed로 계산한다.
- 자식 컴포넌트에 props를 전달하고 emits 이벤트를 받아 상태를 변경한다.

### `BaseDashboardCard.vue`

- 도시 검색과 날씨 목록의 공통 카드 디자인을 담당한다.
- `<slot />`을 사용해 부모가 `SearchBar`와 `WeatheCard` 목록을 주입한다.

### `SearchBar.vue`

- `query`, `showOutingIndex` props로 부모의 검색어와 외출 지수 표시 상태를 받는다.
- 검색어 입력·초기화 시 `update-query`, 외출 지수 버튼 클릭 시 `toggle-outing` 이벤트를 발생시킨다.

### `WeatheCard.vue`

- `city` props로 도시 객체를 받아 날씨 정보와 상세 외출 지수를 표시한다.
- 카드 선택 시 `select-card`, 상세보기 클릭 시 `click-detail` 이벤트와 도시 객체를 부모에 전달한다.
- 마우스 클릭과 Enter·Space 키로 도시를 선택할 수 있다.

## 창의적 추가 Component

### `DogWalkGuide.vue`

- 선택 도시나 최고 추천 도시의 강아지 산책 지수를 독립 UI로 표시한다.
- `city`, `score`, `guide`, `selected`, `timeSlot`, `recommendedTime` props를 받는다.
- 시간대 변경 시 `update-time-slot`, 추천 도시 복귀 시 `reset-city` 이벤트를 부모에 전달한다.

## 스타일 분리

- 공통 대시보드 카드, 검색바, 날씨 카드, 강아지 산책 가이드의 스타일을 각 컴포넌트의 `<style scoped>`로 분리했다.
- `WeatherParent.vue`에는 외출 리포트와 상태바처럼 부모가 직접 렌더링하는 영역의 스타일만 두었다.

# Vue.js 4일차

# 과제4: Weather Router 적용

기존 `WeatherParent`와 분리된 날씨 컴포넌트를 Vue Router 기반의 페이지 구조로 전환했다.

## Router 적용 내용

- `main.js`에서 `app.use(router)`를 호출해 Vue Router를 전역으로 등록했다.
- 각 View는 `() => import(...)` 방식으로 불러오도록 작성해 페이지별로 지연 로딩된다.
- 정의되지 않은 주소는 `/:pathMatch(.*)*` 경로에서 `NotFoundView`로 처리한다.
- `App.vue`에는 `RouterLink`로 만든 내비게이션과 현재 페이지를 표시하는 `RouterView`를 배치했다.
- `/` 경로의 `WeatherHomeView`에서는 기존 `WeatherParent`와 하위 날씨 컴포넌트를 그대로 재사용했다.
- 날씨 카드의 상세보기는 alert 대신 `router.push()`를 사용해 해당 도시의 상세 화면으로 이동한다.
- 상세 페이지는 `/weather/:cityId` 형태의 동적 경로를 사용하고, `route.params.cityId`로 선택한 도시를 찾는다.
- 서비스 소개는 `WeatherAboutView`, 날씨별 생활 팁은 `WeatherTipsView`로 분리했다.

## 라우팅 구조

- `/`은 `WeatherHomeView.vue`와 연결되며 날씨 검색과 지역별 대시보드를 보여준다.
- `/dog-walk`은 `DogWalkView.vue`와 연결되며 강아지 맞춤 산책 분석과 주변 장소를 보여준다.
- `/weather/:cityId`는 `WeatherDetailView.vue`에서 선택한 도시의 상세 날씨를 표시한다.
- `/about`과 `/tips`는 각각 서비스 소개와 날씨별 생활 팁 화면으로 연결된다.
- 나머지 주소는 `NotFoundView.vue`에서 404 안내를 표시한다.

## 추가 확장 기능

### 기존 대시보드 기능 유지

- Router가 적용된 후에도 도시 검색, 검색 초기화, 카드 선택, 외출 지수 표시 기능을 그대로 사용할 수 있다.
- 검색 결과의 평균 기온·습도·풍속과 강수 여부를 반영한 외출 리포트를 제공한다.
- 선택 도시 또는 추천 도시를 기준으로 강아지 산책 지수와 아침·오후·저녁 추천 시간을 안내한다.
- 서울·수원·부산 외에 제주·대전·광주를 포함한 6개 도시를 상세 경로에서 조회할 수 있다.

### 상세 및 예외 처리

- 상세 화면에서 도시명, 날씨 아이콘, 상태, 기온, 습도, 풍속을 한 번에 표시한다.
- 존재하지 않는 `cityId`로 접근하면 빈 화면 대신 `도시 코드에 해당하는 기상 정보가 없다.` 문구를 표시한다.
- 존재하지 않는 URL은 Catch-all Route가 처리하며 날씨 메인으로 돌아가는 링크를 제공한다.

### 내비게이션 및 UI

- 현재 경로의 메뉴에 `router-link-exact-active` 스타일을 적용해 활성 화면을 구분한다.
- 상세·소개·팁·404 화면에 `RouterLink` 기반의 메인 복귀 동선을 제공한다.
- 내비게이션과 기존 날씨 카드·검색 영역에 모바일 반응형 레이아웃을 적용했다.
- 내비게이션에 `aria-label`을 지정하고 기존 카드의 키보드 선택 및 상태 안내 접근성을 유지했다.

- `npm run build`로 전체 View의 지연 로딩 청크 생성을 확인했다.
- 브라우저에서 홈 → 서울 상세(`/weather/city_01`) 이동 시 alert 없이 상세 화면이 표시되는 것을 확인했다.
- `/about`, `/tips`, 정의되지 않은 경로의 렌더링과 브라우저 오류가 없음을 확인했다.

# 과제5: Pinia Weather Store 적용

## Pinia 적용 내용

- `main.js`에서 `app.use(createPinia())`를 호출해 Pinia를 전역으로 등록했다.
- `configStore`에는 온도 단위를 저장하는 `unit` state와 현재 단위 기호를 반환하는 `unitSymbol` getter를 작성했다.
- `toggleUnit` action으로 섭씨와 화씨를 바꿀 수 있으며, 내비게이션 옆의 `UnitToggler`에서 이 기능을 사용한다.
- 선택한 온도 단위는 도시 카드, 외출 리포트, 상세 날씨 화면에 동일하게 적용된다.
- 온도를 정수 또는 소수점 첫째 자리로 표시할 수 있도록 `temperaturePrecision`과 관련 action을 추가했다.
- 화면마다 온도 변환 코드를 반복하지 않도록 `formatTemperature`에서 단위 변환과 자릿수 처리를 함께 담당한다.
- 관심 도시 목록과 필터 상태는 별도의 `favoriteStore`에서 관리한다.

## 창의적 추가 기능: 관심 도시 모아보기

- 각 날씨 카드와 상세 화면에서 도시를 관심 목록에 등록하거나 해제할 수 있다.
- 검색 영역의 `관심 도시만 보기` 버튼으로 등록한 도시만 즉시 필터링한다.
- 관심 목록과 필터 상태는 Pinia의 `favoriteStore`에서 관리하므로 메인과 상세 화면이 같은 상태를 공유한다.
- 등록된 관심 도시 수를 버튼에 함께 표시한다.

## configStore 추가 기능: 온도 소수점 설정

- `소수점 표시` 버튼으로 온도를 정수 또는 소수점 첫째 자리로 전환한다.
- `formatTemperature` action에서 섭씨·화씨 변환, 자릿수 처리, 단위 기호 결합을 한 번에 수행해 화면별 중복을 없앴다.
- 외출·산책 지수 계산 기준은 원본 섭씨 데이터를 유지하고 화면에 표시할 때만 단위를 변환한다.

# 과제6: 외부 UI 라이브러리 및 API

## 최신 UI 확장: 모던 산책 서비스 리뉴얼

[Element Plus](https://element-plus.org/)와 [Element Plus Icons](https://element-plus.org/en-US/component/icon)를 사용하고, 산책·공원 이미지에 어울리는 포레스트 그린과 라임 컬러로 전체 UI를 다시 구성했다. 단순히 기본 컴포넌트를 나열하지 않고 실제 날씨 정보의 중요도에 맞게 화면 구조를 변경했다.

### 외부 UI 라이브러리 적용

- 전체 화면은 `ElContainer`, `ElHeader`, `ElMain`으로 구성했다. 데스크톱에서는 상단 메뉴를 사용하고 모바일에서는 하단 내비게이션이 나타난다.
- 온도 단위와 소수점 설정은 `ElPopover`, `ElButtonGroup`, `ElSwitch`를 사용한 설정 메뉴 안에 정리했다.
- 메인 영역에는 `ElButton`, `ElProgress`, 아이콘 컴포넌트를 사용해 추천 도시의 산책 점수와 주요 날씨 정보를 먼저 보여준다.
- 도시 검색 영역은 `ElInput`, `ElTooltip`, `ElButton`을 이용해 검색, 초기화, 관심 도시 기능을 한곳에서 사용할 수 있게 만들었다.
- 도시별 날씨는 `ElCard`, `ElTag`, `ElProgress`로 구성하고 기온, 체감온도, 습도, 풍속, AQI를 한 카드에 담았다.
- 강아지 맞춤 리포트에는 `ElCollapse`, `ElForm`, `ElSelect`, `ElInputNumber`를 사용해 프로필 입력과 위험 정보를 나누어 표시했다.
- 시간대별 산책 점수는 Apache ECharts와 Vue ECharts로 표시하며, 각 시간의 강수확률과 UV 정보도 함께 확인할 수 있다.
- 주변 동반 장소는 검색 상태에 따라 `ElSkeleton`, `ElAlert`, `ElEmpty`를 보여주고, 검색된 장소는 좌우로 넘길 수 있는 카드 목록으로 구성했다.
- 상세 날씨, 안전 가이드, 서비스 소개, 404 화면도 Element Plus 컴포넌트를 사용해 같은 분위기로 맞췄다.

`src/assets/base.css`에서 Element Plus의 CSS 변수를 서비스 컬러로 재정의했고, 980px과 640px 반응형 구간에서 카드 열 수, 버튼 배치, 헤더, 모바일 하단 메뉴가 전환된다.

### 페이지 구조 리뉴얼

긴 단일 대시보드를 기능별 4개 페이지로 분리하고, 흰색 바탕·얇은 녹색 테두리·연한 녹색 면을 사용하는 산책 서비스 UI로 통일했다.

- `/`은 오늘 날씨 화면이다. 산책 지수 요약과 전국 지역 검색, 도시별 날씨 카드를 표시한다.
- `/dog-walk`에서는 견종 프로필을 입력하고 맞춤 산책 플랜, 시간대 추천, 주변 펫 프렌들리 장소를 확인할 수 있다.
- `/tips`에는 고온, 노면, 비, 한파, 대기질 상황별 행동 요령과 산책 체크리스트를 정리했다.
- `/about`에서는 프로젝트 소개와 사용 기술, API 및 데이터 출처를 확인할 수 있다.

- 홈에서 선택한 도시 ID를 `/dog-walk?city=...`로 전달해 같은 지역의 상세 맞춤 분석을 이어서 확인한다.
- 데스크톱은 상단 캡슐 내비게이션, 모바일은 4개 기능으로 분류된 하단 내비게이션을 사용한다.
- 강아지 페이지의 집→강아지→공원 경로 그래픽과 발자국 브랜드 마크로 산책 서비스의 성격을 강조했다.

### API와 데이터 출처

- [OpenWeatherMap Current Weather](https://openweathermap.org/api/current): 현재 기온, 체감온도, 습도, 풍속, 날씨 상태
- [OpenWeatherMap 5 Day Forecast](https://openweathermap.org/api/forecast5): 5일/3시간 기상 예보
- [Open-Meteo Forecast](https://open-meteo.com/en/docs): 시간대별 산책 추천에 사용하는 시간별 예보
- [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api): CAMS 기반 AQI, PM2.5, UV 정보
- [Kakao Local REST API](https://developers.kakao.com/docs/ko/local/dev-guide): 현재 위치 중심 반려동물 동반 장소 검색
- [The Dog API breeds list Gist](https://gist.github.com/arturschaefer/abf8f94bcff14ace1b88c7977d651a74): 견종 이름, 그룹, 체중 데이터

### 전국 지역 날씨 검색

- 초기 화면은 서울·수원·부산·제주·대전·광주 추천 카드를 빠르게 표시한다.
- 목록에 없는 국내 시·군·구를 입력하면 0.5초 디바운스 후 OpenWeatherMap Geocoding API로 좌표를 검색한다.
- 검색된 국내 좌표로 현재 날씨와 Open-Meteo 대기질을 조회해 동일한 날씨 카드를 동적으로 생성한다.
- 동적 카드도 선택, 관심 지역 등록, 산책 지수, 견종별 체감온도, 시간대별 추천, 5일 상세 예보를 지원한다.
- `GET /api/weather/search?q=강남구`에서 동적 지역 검색을 제공하며, API 키는 기존 날씨 API처럼 백엔드에서만 사용한다.
- 예시 검색어: `강남구`, `춘천`, `포항`, `전주시`, `해운대구`.

## 최신 과제: Axios + 반려동물 날씨 서비스

- Axios를 프론트엔드 API 호출과 Node 백엔드의 외부 API 호출에 적용했다.
- OpenWeatherMap 현재 날씨 API로 서울·수원·부산·제주·대전·광주의 실제 관측값을 표시한다.
- OpenWeatherMap 5일/3시간 예보 API를 상세 화면의 5일 예보로 확장했다.
- Open-Meteo의 AQI·PM2.5·UV와 24시간 예보를 산책 점수와 호흡기 안내에 반영했다.
- OpenWeatherMap API Key는 브라우저에 노출되지 않도록 `.env.local`과 백엔드 프록시에서만 사용한다.
- 기온, 체감온도, 습도, 강수량·확률, 풍속, UV, 대기질을 조합한 산책 지수와 점수 근거를 제공한다.
- The Dog API 견종 목록을 이용한 강아지 프로필과 Kakao REST 현재 위치 기반 동반 장소 검색을 제공한다.

## 최신 확장: 맞춤 산책 지수와 내 주변 동반 장소

### 오늘의 산책 지수와 위험 근거

- 현재 기온·체감온도·습도·강수량·강수확률·풍속·UV·AQI를 0~100점으로 계산한다.
- 점수만 표시하지 않고 고온, 한파, 비, 강풍, 자외선, 미세먼지, 높은 습도 원인을 카드로 설명한다.
- 노면 온도를 측정값처럼 표시하지 않고 기온·UV·강수 조건으로 `노면 고온 위험`을 추정한다.

### 시간대별 BEST 산책 시간

- Open-Meteo의 앞으로 24시간 예보를 시간대별 산책 지수로 가공한다.
- 3시간 간격의 점수·상태·강수확률·UV를 표로 보여주고, 24시간 중 최고 점수 시간을 추천한다.

### 강아지 프로필 기반 개인화

- 이름, 견종, 나이, 몸무게, 털 길이, 활동량을 등록할 수 있다.
- 제공된 [The Dog API breeds list](https://gist.github.com/arturschaefer/abf8f94bcff14ace1b88c7977d651a74)를 백엔드에서 불러온다.
- 단두·북방 견종, 털 길이, 체중, 나이, 활동량을 반영해 견종별 체감온도 참고값과 맞춤 산책 점수를 계산한다.
- 프로필은 외부로 전송하지 않고 브라우저 `localStorage`에 저장한다.
- `프로필 초기화` 버튼으로 저장된 정보와 맞춤 산책 플랜을 삭제하고 기본 입력 상태로 돌아갈 수 있다.

### 견종 기반 오늘의 종합 산책 플랜

- 프로필 저장 즉시 견종 그룹과 일반적인 활동 성향, 나이, 몸무게, 털 길이, 활동량을 현재 날씨·시간별 예보와 함께 분석한다.
- `권장 1회 산책 시간`, `하루 권장 횟수`, `추천 강도`, `오늘 추천 시간대`를 하나의 맞춤 카드로 제공한다.
- 활동성이 높은 견종에는 걷기와 노즈워크를 함께 안내하고, 단두종·추운 기후 견종·성장기·노령견에는 날씨에 맞는 별도 주의사항을 표시한다.
- 모든 시간대의 맞춤 산책 점수가 낮으면 무리하게 BEST 시간을 표시하지 않고 `실내 활동`과 짧은 배변 산책을 권한다.
- 권장 시간은 건강 진단이나 처방이 아닌 일반적인 시작점이다. 실제 운동량은 [AKC의 연령·견종·건강·날씨별 운동 안내](https://www.akc.org/expert-advice/health/how-much-exercise-does-dog-need/)와 [PDSA의 개별 운동량 안내](https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/puppies-dogs/how-much-exercise-does-your-dog-need/)처럼 반려견의 상태에 따라 조절해야 한다.

이 플랜 UI에는 Element Plus의 `ElCard`, `ElTag`, `ElAlert`, `ElSpace`를 사용했다. 요약 정보는 반응형 CSS Grid로 배치해 데스크톱 4열, 모바일 2열로 전환된다.

### Kakao REST 반려동물 동반 장소

- 브라우저 위치 권한을 받은 뒤 현재 위치 반경 2km를 검색한다.
- 백엔드가 Kakao Local REST API로 애견 동반 식당·카페를 검색하고, 중복 제거 후 실제 거리순으로 표시한다.
- 가장 가까운 장소를 강조하고 거리, 주소, Kakao 상세 링크를 함께 제공한다.
- 장소 카드는 반응형 가로 슬라이더로 표시하며 이전·다음 버튼, 터치 스와이프, 키보드 가로 스크롤을 지원한다.
- 키워드 검색 결과이므로 실제 동반 가능 여부와 이용 조건은 방문 전에 매장에 확인해야 한다.

### 주요 구현 파일

- `server.js`: 외부 날씨·예보·대기질·견종·Kakao 장소 검색 프록시
- `src/services/petWeather.js`: 공용 산책 점수, 개인화, 위험 요소, BEST 시간 계산
- `src/components/practices/handson/weather-components/DogWalkGuide.vue`: 산책 리포트, 시간대 표, 프로필
- `src/components/PetPlacesMap.vue`: 위치 권한과 가까운 주변 장소 목록
- `test/petWeather.test.js`: 산책 점수와 개인화 계산 검사

# 과제7: Vercel 배포

- `npm run build`를 실행해 오류 없이 빌드되는지 확인하고, 생성된 `dist` 폴더의 정적 파일을 Vercel로 배포했다.
- `/dog-walk`, `/about`, `/tips` 주소에 직접 접속해도 화면이 열리도록 `vercel.json`에 SPA 경로 설정을 추가했다.
- 날씨와 장소 정보를 제공하는 서버 코드는 Vercel Serverless Function으로 배포하고, 프론트 화면에서는 `/api` 주소로 호출하도록 구성했다.
- OpenWeatherMap과 Kakao API 키는 프론트 코드에 작성하지 않고 Vercel 환경 변수에 등록했다.
- 로컬에서 사용하는 `.env.local` 파일은 Git에 올라가지 않도록 제외했다.
- 최종 배포 주소는 https://skala-walkie-weather.vercel.app 이며, 별도의 로그인 없이 누구나 접속할 수 있다.
- 배포 후 메인 화면과 강아지 산책 날씨 화면에서 날씨 및 주변 장소 정보가 정상적으로 표시되는지 확인했다.
