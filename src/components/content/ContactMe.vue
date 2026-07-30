<template>
  <div class="paddingTop48 contactMeBackground">
    <VContainer class="text-center">
      <h2 class="pageTitle">
        {{ $t('common.getInTouch') }}
      </h2>

      <VResponsive
        class="marginBottom32 marginAuto"
        width="56"
      >
        <VDivider class="divider" />
        <VDivider />
      </VResponsive>

      <VRow>
        <VCol
          v-for="(contact, i) in contacts"
          :key="i"
          cols="12"
          md="4"
        >
          <VCard
            class="paddingTop px-4"
            color="transparent"
            flat
            theme="dark"
          >
            <VAvatar
              color="transparent"
              size="40"
            >
              <font-awesome-icon
                :icon="contact.icon"
                class="size"
              />
            </VAvatar>

            <VCardTitle class="justify-center font-weight-white text-uppercase">
              {{ $t(contact.title) }}
            </VCardTitle>

            <VCardText
              class="text-subtitle-1 text"
              @click="contact.action"
            >
              {{ $t(contact.text) }}
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </VContainer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'ContactMe',

  // The `!` on each method call is Vue's Options API typing, not a real
  // nullability question: inside data() the `this` context types methods as
  // possibly undefined, because data is evaluated while the instance type is
  // still being built. The arrows only run on click, long after methods exist.
  data() {
    return {
      contacts: [
        {
          icon: 'fa-brands fa-linkedin',
          title: 'common.linkedIn',
          text: 'common.clickHere',
          action: () => this.openLinkedIn!(),
        },
        {
          icon: 'fa-brands fa-github',
          title: 'common.gitHub',
          text: 'common.clickHere',
          action: () => this.openGithub!(),
        },
        {
          icon: 'fa-solid fa-envelope',
          title: 'common.mail',
          text: 'common.email',
          action: () => this.openMail!(),
        },
      ],
    };
  },
  methods: {
    openLinkedIn() {
      window.open(
        'https://www.linkedin.com/in/aleksandar-trenchevski-593b45168/',
        '_blank'
      );
    },
    openGithub() {
      window.open('https://github.com/trencho', '_blank');
    },
    openMail() {
      window.location.href = 'mailto:trenche@feit.ukim.edu.mk';
    },
  },
});
</script>
