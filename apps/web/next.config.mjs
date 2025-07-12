import withPWA from "@ducanh2912/next-pwa";

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
});
