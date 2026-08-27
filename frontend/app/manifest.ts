import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Treasure Appointment Portal",
    short_name: "Treasure",
    description: "Manage appointments and clients with Treasure.",
    start_url: "/",
    display: "standalone",
    background_color: "#edede8",
    theme_color: "#edede8",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/home-icon.png",
        sizes: "2048x2048",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
