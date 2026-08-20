// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SliderFilter from '../map/SliderFilter.vue';
import { globalMountOptions, stubBrowserApis, vmOf } from './helpers';

/**
 * These cover an off-by-one that shipped for months behind 303 passing tests.
 *
 * `decrement` and `increment` used to emit through postfix `this.slider--` /
 * `this.slider++`, which yields the value from BEFORE the mutation. The thumb label
 * showed one hour while the map was told another, and because `playSlider` drives
 * increment on an interval, autoplay ran permanently one hour out of step with its own
 * label. `decrement` was `FNDA:0` in coverage -- no test had ever called it.
 *
 * So every assertion here compares the EMITTED value against the component's own state.
 * Asserting only the emitted number would have passed against the broken code on the
 * first step from 0.
 */

interface SliderVm {
  slider: number;
  decrement(): void;
  increment(): void;
  playSlider(): void;
  isPlaying: boolean;
}

const mountSlider = () =>
  mount(SliderFilter, {
    props: { selected: null },
    global: globalMountOptions(),
  });

beforeEach(() => {
  stubBrowserApis();
});

describe('SliderFilter hour stepping', () => {
  it('emits the hour it has just moved to, going up', () => {
    const wrapper = mountSlider();
    const vm = vmOf<SliderVm>(wrapper);
    vm.slider = 12;

    vm.increment();

    expect(vm.slider).toBe(13);
    expect(wrapper.emitted('sliderChange')?.at(-1)).toEqual([13]);
  });

  it('emits the hour it has just moved to, going down', () => {
    const wrapper = mountSlider();
    const vm = vmOf<SliderVm>(wrapper);
    vm.slider = 12;

    vm.decrement();

    expect(vm.slider).toBe(11);
    expect(wrapper.emitted('sliderChange')?.at(-1)).toEqual([11]);
  });

  it('wraps 23 -> 0 and still emits', () => {
    const wrapper = mountSlider();
    const vm = vmOf<SliderVm>(wrapper);
    vm.slider = 23;

    vm.increment();

    expect(vm.slider).toBe(0);
    // The old code returned early here, so the map kept showing hour 23 while the
    // label showed 0 -- one dropped update per lap of autoplay.
    expect(wrapper.emitted('sliderChange')?.at(-1)).toEqual([0]);
  });

  it('wraps 0 -> 23 rather than stepping below zero', () => {
    const wrapper = mountSlider();
    const vm = vmOf<SliderVm>(wrapper);
    vm.slider = 0;

    vm.decrement();

    // Previously this went to -1: increment wrapped, decrement had no floor.
    expect(vm.slider).toBe(23);
    expect(wrapper.emitted('sliderChange')?.at(-1)).toEqual([23]);
  });

  it('never lets the emitted hour disagree with the slider, across a full lap', () => {
    const wrapper = mountSlider();
    const vm = vmOf<SliderVm>(wrapper);
    vm.slider = 0;

    for (let step = 0; step < 24; step += 1) {
      vm.increment();
      expect(wrapper.emitted('sliderChange')?.at(-1)).toEqual([vm.slider]);
    }

    expect(vm.slider).toBe(0);
  });
});

describe('SliderFilter autoplay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the emitted hour in step with the label while playing', () => {
    const wrapper = mountSlider();
    const vm = vmOf<SliderVm>(wrapper);
    vm.slider = 5;

    vm.playSlider();
    expect(vm.isPlaying).toBe(true);

    vi.advanceTimersByTime(500);
    expect(vm.slider).toBe(6);
    expect(wrapper.emitted('sliderChange')?.at(-1)).toEqual([6]);

    vi.advanceTimersByTime(500);
    expect(vm.slider).toBe(7);
    expect(wrapper.emitted('sliderChange')?.at(-1)).toEqual([7]);

    vm.playSlider();
    expect(vm.isPlaying).toBe(false);
  });
});
