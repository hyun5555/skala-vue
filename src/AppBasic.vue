<script setup>
import SampleOne from './components/practices/basic/SampleOne.vue'
import SampleTwo from './components/practices/basic/SampleTwo.vue'
import VueHtml from './components/practices/basic/VueHtml.vue'
import VueHtmlXss from './components/practices/basic/VueHtmlXss.vue'
import VueText from './components/practices/basic/VueText.vue'
import VueBind from './components/practices/basic/VueBind.vue'
import VueBindClass from './components/practices/basic/VueBindClass.vue'
import VueBindStyle from './components/practices/basic/VueBindStyle.vue'
import VueBindShorthand from './components/practices/basic/VueBindShorthand.vue'
import VueIf from './components/practices/basic/VueIf.vue'
import VueShow from './components/practices/basic/VueShow.vue'
import VueFor from './components/practices/basic/VueFor.vue'
import EventObject from './components/practices/basic/EventObject.vue'
import EventBasic from './components/practices/basic/EventBasic.vue'
import EventModifier from './components/practices/basic/EventModifier.vue'

import ModelBasic from './components/practices/basic/ModelBasic.vue'
import ModelForm from './components/practices/basic/ModelForm.vue'
import ModelModifier from './components/practices/basic/ModelModifier.vue'
import StyleScoped from './components/practices/basic/StyleScoped.vue'
import WeatherMockup from './components/WeatherMockup.vue'
// 1. Reactive State
import ReactiveRef from './components/practices/composition/ReactiveRef.vue'
import ReactiveReactive from './components/practices/composition/ReactiveReactive.vue'
// 2. Computed & Watchers
import ComputedBasic from './components/practices/composition/ComputedBasic.vue'
import WatchersBasic from './components/practices/composition/WatchersBasic.vue'
import WatchersMulti from './components/practices/composition/WatchersMulti.vue'
import WatchersDeep from './components/practices/composition/WatchersDeep.vue'
import WatchersReactive from './components/practices/composition/WatchersReactive.vue'
import WatchersRefArray from './components/practices/composition/WatchersRefArray.vue'
import WatchersReactiveArray from './components/practices/composition/WatchersReactiveArray.vue'
import WatchersWatchEffect from './components/practices/composition/WatchersWatchEffect.vue'

// 3. Component Lifecycle
import LifecycleParent from './components/practices/component/LifecycleParent.vue'

// 4. Props & Emits
import PropsEmitsParent from './components/practices/component/PropsEmitsParent.vue'

// 5. Component Slot
import SlotDefaultParent from '@/components/practices/component/SlotDefaultParent.vue'
import SlotNamedParent from '@/components/practices/component/SlotNamedParent.vue'
import SlotScopedParent from '@/components/practices/component/SlotScopedParent.vue'
</script>

<template>
  <div class="practice-container">
    <h1>1. 학습환경구성</h1>
    <hr />
    <SampleOne />
    <SampleTwo />
    <h1>2. Vue Directive</h1>
    <hr />
    <VueHtml />
    <VueHtmlXss />
    <VueText />
    <VueBind />
    <VueBindClass />
    <VueBindStyle />
    <VueBindShorthand />
    <VueIf />
    <VueShow />
    <VueFor />
    <h1>3. Vue Event Handling</h1>
    <hr />
    <EventBasic />
    <EventObject />
    <EventModifier />
    <h1>4. Vue Form Handling</h1>
    <hr />
    <ModelBasic />
    <ModelForm />
    <ModelModifier />
    <h1>5. Vue Style Handling</h1>
    <hr />
    <StyleScoped />
    <WeatherMockup />

    <h1>1. Reactive State</h1>
    <hr />
    <ReactiveRef />
    <ReactiveReactive />

    <h1>2. Computed & Watchers</h1>
    <hr />
    <ComputedBasic />
    <WatchersBasic />
    <WatchersMulti />
    <WatchersDeep />
    <WatchersReactive />
    <WatchersRefArray />
    <WatchersReactiveArray />
    <WatchersWatchEffect />
    <h1>3. Component Lifecycle</h1>
    <hr />
    <LifecycleParent />
    <h1>4. Props & Emits</h1>
    <hr />
    <PropsEmitsParent />
    <h1>5. Component Slot</h1>
    <hr />
    <SlotDefaultParent />
    <SlotNamedParent />
    <SlotScopedParent />
  </div>
</template>

<style>
/* ⚠️ 외부 스타일 파일(예: 버튼 디자인 뭉치)을 이 방 안으로 쏙 가리켜 가져옵니다 */
@import '@/assets/practice.css';
</style>
