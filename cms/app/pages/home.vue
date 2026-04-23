<template>
  <v-container class="pa-0" fluid>
    <!-- Hero Section -->
    <v-sheet
      height="100vh"
      class="d-flex flex-column align-center justify-center text-center hero"
    >
      <v-typography variant="h2" class="mb-4"
        >We Help Achieve Biggest Goals</v-typography
      >
      <v-btn large color="primary" class="cta-btn">Get Started</v-btn>
    </v-sheet>

    <!-- Features Section -->
    <v-container class="my-10">
      <v-typography variant="h3" class="text-center mb-10"
        >The Only App You'll Need</v-typography
      >
      <v-row>
        <v-col
          cols="12"
          md="4"
          v-for="(feature, index) in features"
          :key="index"
        >
          <v-card class="feature-card">
            <v-card-title>{{ feature.title }}</v-card-title>
            <v-card-text>{{ feature.text }}</v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Contact Section -->
    <v-sheet class="contact-section">
      <v-container>
        <v-typography variant="h3" class="text-center mb-10"
          >Contact Us</v-typography
        >
        <v-form class="text-center">
          <v-text-field label="Your Name" outlined class="mb-4"></v-text-field>
          <v-text-field label="Your Email" outlined class="mb-4"></v-text-field>
          <v-textarea
            label="Your Message"
            outlined
            class="mb-4"
            auto-grow
            style="white-space: pre-wrap !important; resize: vertical"
          ></v-textarea>
          <v-btn large color="primary" class="cta-btn">Send Message</v-btn>
        </v-form>
      </v-container>
    </v-sheet>
  </v-container>
</template>

<script setup>
const features = [
  { title: "Feature 1", text: "Detail about feature 1" },
  { title: "Feature 2", text: "Detail about feature 2" },
  { title: "Feature 3", text: "Detail about feature 3" },
];
</script>

<style scoped>
.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.cta-btn {
  background-color: #ff4081;
  color: white;
}

.feature-card {
  text-align: center;
  padding: 20px;
}

.contact-section {
  background-color: #f5f5f5;
  padding: 50px 0;
}
</style>
