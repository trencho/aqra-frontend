// @vitest-environment jsdom

/**
 * Filter components. These guard the Vuetify 2 -> 4 input-API drift, which is
 * the migration's highest-risk surface: `:input-value` -> `:model-value`,
 * `@change` -> `@update:model-value`, and `item-text` -> `item-title` all fail
 * SILENTLY. The component still renders; it just stops emitting.
 */
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Filters from '../map/Filters.vue';
import InputFilters from '../map/InputFilters.vue';
import SliderFilter from '../map/SliderFilter.vue';
import { globalMountOptions,stubBrowserApis } from './helpers';

const inputState = {
  airPollution: {
    cities: {},
    nameInput: {
      id: 'name',
      label: 'common.cityName',
      value: null,
      hidden: false,
      items: [{ label: 'Skopje', value: 'skopje' }],
    },
    sensorInput: {
      id: 'sensor',
      label: 'common.sensors',
      value: null,
      hidden: false,
      items: [{ label: 'Centar', value: 'sensor-1' }],
    },
    pollutantInput: {
      id: 'pollutant',
      label: 'common.pollutants',
      value: null,
      items: [{ label: 'PM10', value: 'pm10' }],
    },
    showCityMarkersInput: { id: 'showCityMarkers', label: 'common.showCityMarkers', value: true },
    showForAllCitiesInput: { id: 'showForAllCities', label: 'common.showForecastForAllCities', value: false },
    showSensorMarkersInput: { id: 'showSensorMarkers', label: 'common.showSensorMarkers', value: false },
    showForAllSensorsInput: { id: 'showForAllSensors', label: 'common.showForecastForAllSensors', value: false },
    showCityBoundariesInput: { id: 'showCityBoundaries', label: 'common.showCityBoundaries', value: false },
  },
};

beforeEach(() => {
  stubBrowserApis();
});

describe('InputFilters', () => {
  const mountIt = () =>
    mount(InputFilters, {
      global: globalMountOptions({ initialState: inputState }),
    });

  it('renders the five toggles and three selects', () => {
    const wrapper = mountIt();

    expect(wrapper.findAllComponents({ name: 'VCheckbox' })).toHaveLength(5);
    expect(wrapper.findAllComponents({ name: 'VSelect' })).toHaveLength(3);
    wrapper.unmount();
  });

  it('emits setShowForAllCities with the input and new value', async () => {
    const wrapper = mountIt();

    await wrapper.findAllComponents({ name: 'VCheckbox' })[0].setValue(true);

    const emitted = wrapper.emitted('setShowForAllCities');
    expect(emitted).toBeTruthy();
    expect(emitted[0][0].value).toBe(true);
    expect(emitted[0][0].input.id).toBe('showForAllCities');
    wrapper.unmount();
  });

  it('emits changeBoundaries, changeCityMarkers and changeSensorMarkers', async () => {
    const wrapper = mountIt();
    const boxes = wrapper.findAllComponents({ name: 'VCheckbox' });

    await boxes[2].setValue(true);
    await boxes[3].setValue(false);
    await boxes[4].setValue(true);

    expect(wrapper.emitted('changeBoundaries')[0][0].value).toBe(true);
    expect(wrapper.emitted('changeCityMarkers')[0][0].value).toBe(false);
    expect(wrapper.emitted('changeSensorMarkers')[0][0].value).toBe(true);
    wrapper.unmount();
  });

  it('emits setName when a city is chosen', async () => {
    const wrapper = mountIt();

    await wrapper
      .findAllComponents({ name: 'VSelect' })[0]
      .setValue('skopje');

    expect(wrapper.emitted('setName')[0][0]).toMatchObject({
      value: 'skopje',
    });
    wrapper.unmount();
  });

  it('emits setPollutant from the third select', async () => {
    const wrapper = mountIt();

    await wrapper.findAllComponents({ name: 'VSelect' })[2].setValue('pm10');

    expect(wrapper.emitted('setPollutant')[0][0].value).toBe('pm10');
    wrapper.unmount();
  });

  it('hides the city and sensor selects when the inputs are marked hidden', () => {
    const wrapper = mount(InputFilters, {
      global: globalMountOptions({
        initialState: {
          airPollution: {
            ...inputState.airPollution,
            nameInput: { ...inputState.airPollution.nameInput, hidden: true },
            sensorInput: {
              ...inputState.airPollution.sensorInput,
              hidden: true,
            },
          },
        },
      }),
    });

    // Only the pollutant select survives.
    expect(wrapper.findAllComponents({ name: 'VSelect' })).toHaveLength(1);
    wrapper.unmount();
  });

  it('passes items through to the selects using item-title', () => {
    const wrapper = mountIt();
    const select = wrapper.findAllComponents({ name: 'VSelect' })[0];

    expect(select.props('items')).toEqual([
      { label: 'Skopje', value: 'skopje' },
    ]);
    // item-text was renamed in Vuetify 3; the old name renders blank options.
    expect(select.props('itemTitle')).toBe('label');
    wrapper.unmount();
  });
});

describe('SliderFilter', () => {
  const mountIt = (pollutantValue = 'pm10') =>
    mount(SliderFilter, {
      props: {
        selected: { selectedTime: Array.from({ length: 24 }, (_, i) => `${i}:00`) },
      },
      global: globalMountOptions({
        initialState: {
          airPollution: { pollutantInput: { value: pollutantValue } },
        },
      }),
    });

  it('is disabled until a pollutant is selected', () => {
    const wrapper = mountIt(null);

    expect(wrapper.findComponent({ name: 'VSlider' }).props('disabled')).toBe(
      true
    );
    wrapper.unmount();
  });

  it('is enabled once a pollutant is selected', () => {
    const wrapper = mountIt();

    expect(wrapper.findComponent({ name: 'VSlider' }).props('disabled')).toBe(
      false
    );
    wrapper.unmount();
  });

  it('spans the 24 hours of the day', () => {
    const wrapper = mountIt();
    const slider = wrapper.findComponent({ name: 'VSlider' });

    expect(Number(slider.props('min'))).toBe(0);
    expect(Number(slider.props('max'))).toBe(23);
    wrapper.unmount();
  });

  it('emits sliderChange when the value moves', async () => {
    const wrapper = mountIt();

    await wrapper.findComponent({ name: 'VSlider' }).setValue(5);

    expect(wrapper.emitted('sliderChange')).toBeTruthy();
    wrapper.unmount();
  });

  it('increment advances the hour and emits', () => {
    const wrapper = mountIt();

    wrapper.vm.increment();

    expect(wrapper.emitted('sliderChange')[0][0]).toBe(0);
    expect(wrapper.vm.slider).toBe(1);
    wrapper.unmount();
  });

  it('increment wraps from 23 back to 0', () => {
    const wrapper = mountIt();
    wrapper.vm.slider = 23;

    wrapper.vm.increment();

    expect(wrapper.vm.slider).toBe(0);
    wrapper.unmount();
  });

  it('playSlider starts a timer and toggles the icon state', () => {
    vi.useFakeTimers();
    const wrapper = mountIt();

    wrapper.vm.playSlider();
    expect(wrapper.vm.isPlaying).toBe(true);

    vi.advanceTimersByTime(1500);
    expect(wrapper.emitted('sliderChange').length).toBeGreaterThanOrEqual(3);

    wrapper.vm.playSlider();
    expect(wrapper.vm.isPlaying).toBe(false);

    wrapper.unmount();
    vi.useRealTimers();
  });

  // Regression guard: playSlider used to start an interval that nothing ever
  // cleared, so leaving playback running and switching tabs left a timer
  // firing against an unmounted component forever.
  it('clears its interval on unmount', () => {
    vi.useFakeTimers();
    const clearSpy = vi.spyOn(global, 'clearInterval');
    const wrapper = mountIt();

    wrapper.vm.playSlider();
    wrapper.unmount();

    expect(clearSpy).toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe('Filters', () => {
  it('forwards every child event up to its parent', async () => {
    const wrapper = mount(Filters, {
      props: { selected: null },
      global: globalMountOptions({ initialState: inputState }),
    });

    const inputs = wrapper.findComponent(InputFilters);
    inputs.vm.$emit('setName', { value: 'skopje' });
    inputs.vm.$emit('setPollutant', { value: 'pm10' });
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('setName')[0][0]).toEqual({ value: 'skopje' });
    expect(wrapper.emitted('setPollutant')[0][0]).toEqual({ value: 'pm10' });
    wrapper.unmount();
  });

  it('forwards sliderChange from the slider', async () => {
    const wrapper = mount(Filters, {
      props: { selected: null },
      global: globalMountOptions({ initialState: inputState }),
    });

    wrapper.findComponent(SliderFilter).vm.$emit('sliderChange', 7);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('sliderChange')[0][0]).toBe(7);
    wrapper.unmount();
  });
});
