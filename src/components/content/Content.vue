<template>
  <div>
    <section id="welcome-page">
      <WelcomePage />
    </section>
    <section id="about-me">
      <AboutMeSection />
    </section>
    <section id="projectInfo">
      <ProjectInfoSection />
    </section>
    <section id="contactMe">
      <ContactMe />
    </section>
  </div>
</template>

<script>
import AboutMeSection from './AboutMeSection.vue';
import ContactMe from './ContactMe.vue';
import ProjectInfoSection from './ProjectInfoSection.vue';
import WelcomePage from './WelcomePage.vue';

export default {
  name: 'Content',

  components: {
    ContactMe,
    WelcomePage,
    AboutMeSection,
    ProjectInfoSection,
  },
};
</script>
