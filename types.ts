@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Outfit:wght@300;400;500;600&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Outfit", sans-serif;
}

body {
  @apply bg-neutral-50 text-neutral-900 font-sans antialiased;
}

.glass {
  @apply bg-white/80 backdrop-blur-md border border-white/20;
}
