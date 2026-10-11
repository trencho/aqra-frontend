<template>
  <div class="legal">
    <VContainer class="legalContainer">
      <div class="legalGrid">
        <article
          class="legalArticle"
          :aria-labelledby="headingId"
        >
          <!--
            role="note" rather than VAlert's default "alert": the banner is
            static page content, and an alert role would interrupt a screen
            reader on every navigation between the six pages.
          -->
          <VAlert
            v-if="!published"
            class="legalDraft"
            type="warning"
            variant="tonal"
            prominent
            role="note"
            :title="$t('legal.draftBanner')"
            :text="$t('legal.draftBannerDetail')"
          />

          <header class="legalHeader">
            <h1
              :id="headingId"
              class="legalTitle"
            >
              {{ $t(title) }}
            </h1>
            <p class="legalSummary">
              {{ $t(summary) }}
            </p>
            <p class="legalMeta">
              <span>{{ versionLabel }}</span>
              <span>{{ $t('legal.lastUpdated', { date: lastUpdated }) }}</span>
            </p>
          </header>

          <slot />
        </article>

        <nav
          class="legalNav"
          :aria-label="$t('legal.otherDocuments')"
        >
          <p class="legalNavTitle">
            {{ $t('legal.otherDocuments') }}
          </p>
          <ul>
            <li
              v-for="page in pages"
              :key="page.id"
            >
              <!-- RouterLink sets aria-current="page" on the active entry. -->
              <RouterLink :to="page.path">
                {{ $t(page.title) }}
              </RouterLink>
            </li>
          </ul>
        </nav>
      </div>
    </VContainer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import {
  isLegalPublished,
  LEGAL_LAST_UPDATED,
  LEGAL_VERSION,
  LegalPages,
} from '@/constants/legal';

/**
 * The frame every legal page shares: the draft banner, the title block with
 * version and date, and the list of sibling documents. The page body goes in
 * the default slot.
 */
export default defineComponent({
  name: 'LegalLayout',

  props: {
    /** Used to build a stable heading id. */
    pageId: { type: String, required: true },
    /** i18n key. */
    title: { type: String, required: true },
    /** i18n key. */
    summary: { type: String, required: true },
  },

  data() {
    return {
      pages: LegalPages,
      lastUpdated: LEGAL_LAST_UPDATED,
      published: isLegalPublished(),
    };
  },

  computed: {
    headingId(): string {
      return `legal-${this.pageId}-title`;
    },

    versionLabel(): string {
      const key = this.published ? 'legal.version' : 'legal.versionDraft';
      return this.$t(key, { version: LEGAL_VERSION });
    },
  },
});
</script>

<style lang="scss" scoped>
// Same dark surfaces as the rest of the app: #292929 is the app bar and footer,
// so the reading column sits a step darker and the frame reads as one piece.
.legal {
  background: #1d1d1d;
  color: rgba(255, 255, 255, 0.87);
  min-height: 100%;
}

.legalContainer {
  padding-top: 48px;
  padding-bottom: 64px;
}

// Article first in the source, so a screen reader reaches the text before the
// sibling list. On wide screens the list moves into a narrow column on the
// right; on phones it follows the article.
.legalGrid {
  display: grid;
  gap: 48px;
  grid-template-columns: minmax(0, 1fr);

  @media (min-width: 960px) {
    grid-template-columns: minmax(0, 68ch) 220px;
    justify-content: center;
  }
}

.legalDraft {
  margin-bottom: 32px;
}

.legalHeader {
  margin-bottom: 40px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.16);
}

.legalTitle {
  font-family: 'Roboto', sans-serif;
  font-size: 2.5rem;
  font-weight: 300;
  line-height: 1.2;
  margin-bottom: 12px;
  color: #fff;
}

.legalSummary {
  font-family: 'Roboto', sans-serif;
  font-size: 1.125rem;
  line-height: 1.6;
  margin-bottom: 16px;
}

// Two facts on two lines; no separator glyph to read aloud.
.legalMeta {
  display: flex;
  flex-direction: column;
  font-family: 'Roboto', sans-serif;
  font-size: 0.875rem;
  color: #bdbdbd;
}

// Sticky so the sibling list stays reachable while reading a long policy.
.legalNav {
  align-self: start;

  @media (min-width: 960px) {
    position: sticky;
    top: 96px;
  }

  ul {
    list-style: none;
    padding: 0;
    border-left: 1px solid rgba(255, 255, 255, 0.16);
  }

  li + li {
    margin-top: 4px;
  }

  a {
    display: block;
    margin-left: -1px;
    padding: 6px 12px;
    border-left: 3px solid transparent;
    font-family: 'Roboto', sans-serif;
    font-size: 0.9375rem;
    color: #bdbdbd;
    text-decoration: none;

    &:hover {
      color: #fff;
      text-decoration: underline;
    }

    &:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 2px;
    }

    &[aria-current='page'] {
      border-left-color: #fff;
      color: #fff;
      font-weight: 500;
    }
  }
}

.legalNavTitle {
  font-family: 'Roboto', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 8px;
  color: #fff;
}
</style>
