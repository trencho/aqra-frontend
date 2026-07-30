// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Component } from 'vue';

import { APP_BAR_HEIGHT } from '@/constants/layout';

import AboutMeSection from '../content/AboutMeSection.vue';
import ContactMe from '../content/ContactMe.vue';
import Content from '../content/Content.vue';
import ProjectInfoSection from '../content/ProjectInfoSection.vue';
import WelcomePage from '../content/WelcomePage.vue';
import SwaggerDocumentation from '../swaggerDocumentation/SwaggerDocumentation.vue';
import { globalMountOptions, stubBrowserApis, vmOf } from './helpers';

const mountIt = (Component: Component) =>
  mount(Component, { global: globalMountOptions() });

beforeEach(() => {
  stubBrowserApis();
});

describe.each([
  ['WelcomePage', WelcomePage],
  ['AboutMeSection', AboutMeSection],
  ['ProjectInfoSection', ProjectInfoSection],
  ['ContactMe', ContactMe],
  ['Content', Content],
])('%s', (name, Component) => {
  it('renders without throwing', () => {
    const wrapper = mountIt(Component);

    expect(wrapper.exists()).toBe(true);
    wrapper.unmount();
  });

  it('leaks no untranslated i18n keys into the DOM', () => {
    const wrapper = mountIt(Component);

    expect(wrapper.text()).not.toMatch(/\bcommon\.[a-zA-Z]+/);
    wrapper.unmount();
  });
});

describe('Content', () => {
  it('composes all four sections', () => {
    const wrapper = mountIt(Content);

    expect(wrapper.findComponent(WelcomePage).exists()).toBe(true);
    expect(wrapper.findComponent(AboutMeSection).exists()).toBe(true);
    expect(wrapper.findComponent(ProjectInfoSection).exists()).toBe(true);
    expect(wrapper.findComponent(ContactMe).exists()).toBe(true);
    wrapper.unmount();
  });
});

describe('WelcomePage', () => {
  it('sizes the hero image to the viewport below the app bar', () => {
    const wrapper = mountIt(WelcomePage);

    expect(wrapper.findComponent({ name: 'VImg' }).props('height')).toBe(
      `calc(100vh - ${APP_BAR_HEIGHT}px)`
    );
    wrapper.unmount();
  });
});

describe('ContactMe', () => {
  it('renders one card per contact channel', () => {
    const wrapper = mountIt(ContactMe);

    expect(wrapper.findAllComponents({ name: 'VCard' })).toHaveLength(3);
    wrapper.unmount();
  });

  it('renders the contact email as a real address, not the i18n escape', () => {
    // The address is stored escaped as {'@'} because vue-i18n 9+ reads a bare
    // @ as linked-message syntax. If the escape were wrong, the braces would
    // show up here.
    const wrapper = mountIt(ContactMe);

    expect(wrapper.text()).toContain('trenche@feit.ukim.edu.mk');
    expect(wrapper.text()).not.toContain("{'@'}");
    wrapper.unmount();
  });

  it('opens LinkedIn in a new tab', () => {
    const open = vi.fn();
    window.open = open;
    const wrapper = mountIt(ContactMe);

    vmOf<{ openLinkedIn(): void }>(wrapper).openLinkedIn();

    expect(open).toHaveBeenCalledWith(
      expect.stringContaining('linkedin.com'),
      '_blank'
    );
    wrapper.unmount();
  });

  it('opens GitHub in a new tab', () => {
    const open = vi.fn();
    window.open = open;
    const wrapper = mountIt(ContactMe);

    vmOf<{ openGithub(): void }>(wrapper).openGithub();

    expect(open).toHaveBeenCalledWith(
      'https://github.com/trencho',
      '_blank'
    );
    wrapper.unmount();
  });
});

describe('ProjectInfoSection', () => {
  it('renders one card per info entry', () => {
    const wrapper = mountIt(ProjectInfoSection);

    expect(wrapper.findAllComponents({ name: 'VCard' })).toHaveLength(2);
    wrapper.unmount();
  });
});

describe('SwaggerDocumentation', () => {
  it('renders a plain iframe now that vue-iframes is gone', () => {
    const wrapper = mountIt(SwaggerDocumentation);

    const frame = wrapper.find('iframe');
    expect(frame.exists()).toBe(true);
    expect(frame.attributes('src')).toBe(
      'https://aqra.feit.ukim.edu.mk/api/v1/apidocs/'
    );
    wrapper.unmount();
  });

  it('gives the iframe an accessible title', () => {
    const wrapper = mountIt(SwaggerDocumentation);

    expect(wrapper.find('iframe').attributes('title')).toBeTruthy();
    wrapper.unmount();
  });

  it('sizes the frame to the viewport below the app bar', () => {
    const wrapper = mountIt(SwaggerDocumentation);

    expect(
      vmOf<{ frameStyle: Record<string, string> }>(wrapper).frameStyle.height
    ).toBe(
      `calc(100vh - ${APP_BAR_HEIGHT}px)`
    );
    wrapper.unmount();
  });
});
