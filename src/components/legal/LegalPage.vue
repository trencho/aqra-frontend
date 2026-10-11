<template>
  <LegalLayout
    :page-id="page.id"
    :title="page.title"
    :summary="page.summary"
  >
    <section
      v-for="(section, i) in page.sections"
      :key="section.heading"
      class="legalSection"
      :aria-labelledby="`legal-${page.id}-section-${i}`"
    >
      <h2
        :id="`legal-${page.id}-section-${i}`"
        class="legalSectionTitle"
      >
        {{ $t(section.heading) }}
      </h2>
      <p
        v-for="paragraph in section.paragraphs"
        :key="paragraph"
      >
        {{ $t(paragraph) }}
      </p>
      <ul
        v-if="section.links"
        class="legalLinks"
      >
        <li
          v-for="link in section.links"
          :key="link.href"
        >
          <a :href="link.href">{{ $t(link.label) }}</a>
        </li>
      </ul>
    </section>
  </LegalLayout>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';

import type { LegalPage, LegalPageId } from '@/constants/legal';
import { isLegalPublished, legalPageById } from '@/constants/legal';

import LegalLayout from './LegalLayout.vue';

/** index.html's title, restored when a legal page is left. */
const APP_TITLE = 'AQRA';
const ROBOTS_META_ID = 'legal-robots';

/**
 * Renders one legal page from its LegalPages definition. The router passes the
 * id as a prop, so all six routes share this one lazily loaded component.
 *
 * It also owns the two head tags a legal page needs: a per-page <title>, and a
 * robots noindex while the text is an unreviewed draft, so search engines do
 * not index wording FEIT/UKIM has not approved.
 */
export default defineComponent({
  name: 'LegalPage',

  components: { LegalLayout },

  props: {
    pageId: { type: String as PropType<LegalPageId>, required: true },
  },

  computed: {
    page(): LegalPage {
      return legalPageById(this.pageId);
    },

    documentTitle(): string {
      return `${this.$t(this.page.title)} | ${APP_TITLE}`;
    },
  },

  watch: {
    // Recomputes on a locale switch as well as on navigation between pages,
    // because $t is reactive on the active locale.
    documentTitle: {
      handler(title: string) {
        document.title = title;
      },
      immediate: true,
    },
  },

  mounted() {
    if (!isLegalPublished() && !document.getElementById(ROBOTS_META_ID)) {
      const meta = document.createElement('meta');
      meta.id = ROBOTS_META_ID;
      meta.name = 'robots';
      meta.content = 'noindex';
      document.head.appendChild(meta);
    }
  },

  unmounted() {
    document.title = APP_TITLE;
    document.getElementById(ROBOTS_META_ID)?.remove();
  },
});
</script>

<style lang="scss" scoped>
.legalSection {
  font-family: 'Roboto', sans-serif;
  font-size: 1rem;
  line-height: 1.65;

  & + & {
    margin-top: 36px;
  }

  p + p {
    margin-top: 12px;
  }
}

.legalSectionTitle {
  font-size: 1.375rem;
  font-weight: 500;
  line-height: 1.3;
  margin-bottom: 12px;
  color: #fff;
}

.legalLinks {
  margin-top: 12px;
  padding-left: 20px;

  li + li {
    margin-top: 4px;
  }

  // Light blue on #1d1d1d is above 9:1. Underlined so a link never depends on
  // colour alone to read as one.
  a {
    display: inline-block;
    padding: 3px 0;
    color: #90caf9;
    text-decoration: underline;
    text-underline-offset: 2px;

    &:hover {
      color: #bbdefb;
    }

    &:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 2px;
    }
  }
}
</style>
