// @vitest-environment jsdom

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';

// These specs run the real store actions (stubActions: false), so setValue
// reaches the API layer. Without this mock jsdom issues real XHRs, which
// surface as unhandled AxiosErrors and fail the run even when every
// assertion passes.
vi.mock('@/services/api', () => ({
  aqra: {
    getDataForAllCities: vi.fn(() => Promise.resolve({ status: 200, data: [] })),
    getAvailableSensorsForCity: vi.fn(() =>
      Promise.resolve({ status: 200, data: [] })
    ),
    getForecastBySpecificCoordinates: vi.fn(() =>
      Promise.resolve({ status: 200, data: null })
    ),
    getForecastForSpecificSensor: vi.fn(() =>
      Promise.resolve({ status: 200, data: null })
    ),
    getDataForAllAvailablePollutantsBySensorId: vi.fn(() =>
      Promise.resolve({ status: 200, data: [] })
    ),
    getDataForHistoricalPollution: vi.fn(() =>
      Promise.resolve({ status: 200, data: null })
    ),
  },
}));

import Statistics from '../statistics/Statistics.vue';
import StatisticFilters from '../statistics/StatisticFilters.vue';
import LineChart from '../statistics/LineChart.vue';
import { useAirPollutionStore } from '@/stores/airPollution';
import { stubBrowserApis, globalMountOptions } from './helpers';

const filterState = {
  airPollution: {
    nameInput: {
      id: 'name',
      label: 'common.cityName',
      value: 'skopje',
      items: [{ label: 'Skopje', value: 'skopje' }],
    },
    sensorInput: {
      id: 'sensor',
      label: 'common.sensors',
      value: 'sensor-1',
      items: [{ label: 'Centar', value: 'sensor-1' }],
    },
    pollutantInput: {
      id: 'pollutant',
      label: 'common.pollutants',
      value: ['pm10'],
      items: [{ label: 'PM10', value: 'pm10' }],
    },
    historyData: {
      'sensor-1': {
        data: [
          { time: '15/01/2024 10:30', pm10: 42 },
          { time: '15/01/2024 11:30', pm10: 45 },
        ],
      },
    },
  },
};

beforeEach(() => {
  stubBrowserApis();
});

describe('StatisticFilters', () => {
  const mountIt = () =>
    mount(StatisticFilters, {
      global: globalMountOptions({
        initialState: filterState,
        stubActions: false,
      }),
    });

  it('renders the three selects and the show button', () => {
    const wrapper = mountIt();

    expect(wrapper.findAllComponents({ name: 'VSelect' })).toHaveLength(3);
    expect(wrapper.findComponent({ name: 'VBtn' }).exists()).toBe(true);
    wrapper.unmount();
  });

  it('allows multiple pollutants on the third select', () => {
    const wrapper = mountIt();

    expect(
      wrapper.findAllComponents({ name: 'VSelect' })[2].props('multiple')
    ).toBe(true);
    wrapper.unmount();
  });

  it('emits show when the button is clicked', async () => {
    const wrapper = mountIt();

    await wrapper.findComponent({ name: 'VBtn' }).trigger('click');

    expect(wrapper.emitted('show')).toBeTruthy();
    wrapper.unmount();
  });

  it('disables the button until a pollutant is chosen', () => {
    const wrapper = mount(StatisticFilters, {
      global: globalMountOptions({
        initialState: {
          airPollution: {
            ...filterState.airPollution,
            pollutantInput: {
              ...filterState.airPollution.pollutantInput,
              value: null,
            },
          },
        },
      }),
    });

    expect(wrapper.findComponent({ name: 'VBtn' }).props('disabled')).toBe(
      true
    );
    wrapper.unmount();
  });

  it('writes a city choice back through the store', async () => {
    // Stubbed actions here on purpose: this asserts only that the select is
    // wired to setValue. Running the real action would additionally exercise
    // the unguarded cities[cityName] lookup (see the Phase 8 characterization
    // tests in map.spec.js), which is a different concern.
    const wrapper = mount(StatisticFilters, {
      global: globalMountOptions({ initialState: filterState }),
    });
    const store = useAirPollutionStore();

    await wrapper
      .findAllComponents({ name: 'VSelect' })[0]
      .setValue('skopje');

    expect(store.setValue).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'skopje' })
    );
    wrapper.unmount();
  });
});

describe('LineChart', () => {
  const chartData = {
    labels: ['10:30', '11:30'],
    datasets: [{ label: 'PM10', data: [42, 45], borderColor: '#ff0000' }],
  };

  it('renders without throwing', () => {
    const wrapper = mount(LineChart, {
      props: { chartData, options: { responsive: true } },
      global: globalMountOptions(),
    });

    expect(wrapper.exists()).toBe(true);
    wrapper.unmount();
  });

  // Asserted against the registry rather than by rendering: jsdom cannot
  // provide a canvas 2D context, so Chart.js bails early with "can't acquire
  // context" and a render-only test would pass even with nothing registered.
  //
  // Chart.js 3+ is tree-shakeable -- without Chart.register(...registerables)
  // a real browser throws "line is not a registered controller". That, plus
  // the old vue-chartjs v2 API, is why the Statistics tab never drew.
  it('registers the Chart.js line controller, scales and elements', async () => {
    // Importing the component is what runs Chart.register(...).
    await import('../statistics/LineChart.vue');
    const { Chart } = await import('chart.js');

    expect(Chart.registry.getController('line')).toBeTruthy();
    expect(Chart.registry.getScale('linear')).toBeTruthy();
    expect(Chart.registry.getScale('category')).toBeTruthy();
    expect(Chart.registry.getElement('point')).toBeTruthy();
  });

  it('renders a canvas', () => {
    const wrapper = mount(LineChart, {
      props: { chartData, options: { responsive: true } },
      global: globalMountOptions(),
    });

    expect(wrapper.find('canvas').exists()).toBe(true);
    wrapper.unmount();
  });

  it('accepts chartData and options as props', () => {
    const options = { responsive: true };
    const wrapper = mount(LineChart, {
      props: { chartData, options },
      global: globalMountOptions(),
    });

    // toEqual, not toBe: Vue wraps props in a reactive proxy, so identity
    // differs from the object that was passed in.
    expect(wrapper.props('chartData')).toEqual(chartData);
    expect(wrapper.props('options')).toEqual(options);
    wrapper.unmount();
  });

  it('renders one dataset per series it is given', () => {
    const twoSeries = {
      labels: ['10:30'],
      datasets: [
        { label: 'PM10', data: [42] },
        { label: 'PM2.5', data: [21] },
      ],
    };
    const wrapper = mount(LineChart, {
      props: { chartData: twoSeries, options: { responsive: true } },
      global: globalMountOptions(),
    });

    expect(wrapper.props('chartData').datasets).toHaveLength(2);
    expect(wrapper.find('canvas').exists()).toBe(true);
    wrapper.unmount();
  });
});

describe('Statistics', () => {
  // Statistics calls initStatisticPage() on beforeMount, which rebuilds the
  // three filter inputs from scratch and resets their values -- so seeding via
  // createTestingPinia's initialState is overwritten before any test runs.
  // Seed the store after mounting instead.
  const mountIt = (pollutants = ['pm10']) => {
    const wrapper = mount(Statistics, {
      global: {
        ...globalMountOptions({
          initialState: filterState,
          stubActions: false,
        }),
        stubs: { LineChart: true },
      },
    });

    const store = useAirPollutionStore();
    store.sensorInput.value = 'sensor-1';
    store.pollutantInput.value = pollutants;
    store.historyData = filterState.airPollution.historyData;

    return wrapper;
  };

  it('hides the chart until statistics have been generated', () => {
    const wrapper = mountIt();

    expect(wrapper.findComponent({ name: 'LineChart' }).exists()).toBe(false);
    wrapper.unmount();
  });

  it('builds chart data from the selected pollutants on show', async () => {
    const wrapper = mountIt();

    await wrapper.findComponent(StatisticFilters).vm.$emit('show');
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.chartData.datasets).toHaveLength(1);
    expect(wrapper.vm.chartData.datasets[0].label).toBe('PM10');
    expect(wrapper.vm.chartData.datasets[0].data).toEqual([42, 45]);
    wrapper.unmount();
  });

  it('uses the series timestamps as chart labels', async () => {
    const wrapper = mountIt();

    await wrapper.findComponent(StatisticFilters).vm.$emit('show');

    expect(wrapper.vm.chartData.labels).toEqual([
      '15/01/2024 10:30',
      '15/01/2024 11:30',
    ]);
    wrapper.unmount();
  });

  it('shows the chart once data exists', async () => {
    const wrapper = mountIt();

    await wrapper.findComponent(StatisticFilters).vm.$emit('show');
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent({ name: 'LineChart' }).exists()).toBe(true);
    wrapper.unmount();
  });

  // Regression guard: labels came from historyData[0].time with no guard, so
  // an empty series threw a TypeError instead of rendering nothing.
  it('survives an empty series without throwing', async () => {
    const wrapper = mountIt([]);

    await wrapper.findComponent(StatisticFilters).vm.$emit('show');

    expect(wrapper.vm.chartData.datasets).toEqual([]);
    expect(wrapper.vm.chartData.labels).toEqual([]);
    wrapper.unmount();
  });

  // CHARACTERIZATION -- mapHistoryToSeries declares `selectedPollutants = []`,
  // but a JS default parameter only applies to `undefined`, never to `null`.
  // initStatisticPage() sets pollutantInput.value to null, so this path throws.
  // The UI is saved only by the Show button's :disabled guard; nothing in the
  // function itself is safe. Phase 8 should coalesce null to [].
  it('currently THROWS when the pollutant selection is null (see Phase 8)', async () => {
    const wrapper = mountIt(null);

    await expect(wrapper.vm.createStatistics()).rejects.toThrow(TypeError);
    wrapper.unmount();
  });
});
