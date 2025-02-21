<template>
  <div>
    <vue-iframe
      :style="'height: calc(100vh - ' + $vuetify.application.top + 'px); width: 100%'"
      height="100%"
      src="https://aqra.feit.ukim.edu.mk/api/v1/apidocs/"
      width="100%"
    />
  </div>
</template>

<script>

export default {
  name: "SwaggerDocumentation",
}
</script>