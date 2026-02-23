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
import ContactMe from './ContactMe';
import WelcomePage from './WelcomePage';
import AboutMeSection from './AboutMeSection';
import ProjectInfoSection from './ProjectInfoSection';

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
