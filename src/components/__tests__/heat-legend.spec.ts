// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';

import { PollutantRatio } from '@/constants/pollutants';
import type { PollutantKey } from '@/types/domain';

import HeatLegend from '../map/HeatLegend.vue';
import { globalMountOptions, stubBrowserApis } from './helpers';

beforeEach(() => {
  stubBrowserApis();
});

const mountIt = (pollutant: PollutantKey = 'pm10') =>
  mount(HeatLegend, {
    props: { pollutant },
    global: globalMountOptions(),
  });

describe('HeatLegend', () => {
  it('labels the pollutant it is describing', () => {
    const wrapper = mountIt('pm2_5');

    expect(wrapper.text()).toContain('PM2.5');
    wrapper.unmount();
  });

  it('renders one tick per gradient stop', () => {
    const wrapper = mountIt();

    expect(wrapper.findAll('.heatLegendTick')).toHaveLength(6);
    wrapper.unmount();
  });

  // The reason the component exists. Same six colours either side; the numbers
  // are what changes, and before this there was nothing on screen saying so.
  it('shows the value range of the selected pollutant, not a fixed scale', () => {
    const so2 = mountIt('so2');
    expect(so2.findAll('.heatLegendTick').map((t) => t.text())).toEqual([
      '0',
      '250',
      '500',
      '750',
      '1000',
      '1250',
    ]);
    so2.unmount();

    const nh3 = mountIt('nh3');
    expect(nh3.findAll('.heatLegendTick').map((t) => t.text())).toEqual([
      '0',
      '0.2',
      '0.4',
      '0.6',
      '0.8',
      '1',
    ]);
    nh3.unmount();
  });

  it('tops out at the divisor that defines full intensity', () => {
    (Object.keys(PollutantRatio) as PollutantKey[]).forEach((p) => {
      const wrapper = mountIt(p);

      expect(wrapper.findAll('.heatLegendTick').at(-1)?.text()).toBe(
        String(PollutantRatio[p])
      );
      wrapper.unmount();
    });
  });

  // jsdom applies no stylesheet, but it does keep an inline style attribute,
  // which is where the gradient is set. So this is one of the few visual
  // properties this suite can assert on -- and it is the one tying the bar to
  // constants/map.ts.
  //
  // Asserted as rgb(), not hex: jsdom's CSSOM normalises colours when it parses
  // the declaration, so `#2a962c` comes back as `rgb(42, 150, 44)`. The hex
  // form is pinned where it is actually produced, in heatLegend.spec.ts.
  it('paints the heatmap gradient in ascending order', () => {
    const wrapper = mountIt();
    const style = wrapper.find('.heatLegendBar').attributes('style') ?? '';

    expect(style).toContain('rgb(42, 150, 44) 0%');
    expect(style).toContain('rgb(173, 0, 0) 100%');
    // Object.keys on the gradient yields '0', '1', '0.2', ... so a component
    // iterating it directly would put the dark red second.
    expect(style.indexOf('rgb(72, 240, 75)')).toBeLessThan(
      style.indexOf('rgb(173, 0, 0)')
    );
    wrapper.unmount();
  });

  // The bar is a gradient and the ticks are loose numbers, so read linearly
  // this announces as six bare digits attached to nothing.
  it('names the whole scale for a screen reader', () => {
    const wrapper = mountIt('so2');
    const legend = wrapper.find('.heatLegend');

    expect(legend.attributes('role')).toBe('img');
    expect(legend.attributes('aria-label')).toContain('SO2');
    expect(legend.attributes('aria-label')).toContain('1250');
    // The visible ticks repeat what the label already says, so they are hidden
    // from the accessibility tree rather than announced twice.
    expect(wrapper.find('.heatLegendTicks').attributes('aria-hidden')).toBe(
      'true'
    );
    wrapper.unmount();
  });
});
