<template>
  <!--
    No fixed height: it was 100px for one line of text, and the legal links and
    data credits wrap onto several lines on a phone.
  -->
  <VFooter
    class="footer"
    color="#292929"
  >
    <div class="footerInner">
      <nav :aria-label="$t('footer.legalNav')">
        <ul class="footerList">
          <li
            v-for="page in legalPages"
            :key="page.id"
          >
            <RouterLink :to="page.path">
              {{ $t(page.title) }}
            </RouterLink>
          </li>
        </ul>
      </nav>

      <!--
        Visible on every page, not only on the data-sources page: OpenWeather's
        ODbL terms and OpenStreetMap's licence both ask for attribution where
        the data is shown.
      -->
      <ul
        class="footerList footerCredits"
        :aria-label="$t('footer.credits')"
      >
        <li
          v-for="credit in credits"
          :key="credit.href"
        >
          <a :href="credit.href">{{ $t(credit.label) }}</a>
        </li>
      </ul>

      <!--
        Vuetify 3 dropped the `grey--text text--lighten-1` colour helpers in
        favour of `text-<colour>-<variant>`, and `title` became `text-h6`.
      -->
      <div class="text-h6 font-weight-light text-grey-lighten-1 text-center">
        {{ new Date().getFullYear() }}, {{ $t('common.skopje') }}
      </div>
    </div>
  </VFooter>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { DataCredits, LegalPages } from '@/constants/legal';

export default defineComponent({
  name: 'Footer',

  data() {
    return {
      legalPages: LegalPages,
      credits: DataCredits,
    };
  },
});
</script>

<style lang="scss" scoped>
.footer {
  justify-content: center;
  padding: 24px 16px;
}

.footerInner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 960px;
}

.footerList {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px 20px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-family: 'Roboto', sans-serif;
  font-size: 0.875rem;

  // #e0e0e0 on #292929 is about 11:1 and the credits' #bdbdbd about 8:1, so
  // both clear AA for small text.
  // inline-block with vertical padding lifts each target to 25px, above the
  // 24px minimum of WCAG 2.5.8; bare 14px text gave 17px.
  a {
    display: inline-block;
    padding: 4px 0;
    color: #e0e0e0;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }

    &:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 2px;
      text-decoration: underline;
    }
  }
}

.footerCredits a {
  color: #bdbdbd;
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
