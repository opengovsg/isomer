export const Navbar = {
  id: "Navbar",
  components: [
    {
      id: "Navbar",
      props: {
        logo: {
          url: "/.storybook/assets/isomer-logo.svg",
          alt: "Isomer logo",
        },
        search: { isEnabled: true, searchUrl: "/search" },
        links: [
          {
            type: "dropdown",
            name: "About Isomer",
            eventKey: "about-isomer",
            links: [
              {
                type: "single",
                name: "What is Isomer",
                url: "/about-isomer/what-is-isomer/overview/",
              },
              {
                type: "single",
                name: "Why use Isomer",
                url: "/about-isomer/why-use-isomer/",
              },
              {
                type: "single",
                name: "Who uses Isomer",
                url: "/about-isomer/who-uses-isomer/",
              },
            ],
          },
          {
            type: "dropdown",
            name: "When To Use Isomer",
            eventKey: "when-to-use-isomer",
            links: [
              {
                type: "single",
                name: "What are the use cases for Isomer?",
                url: "/when-to-use-isomer/use-cases/",
              },
              {
                type: "single",
                name: "What are static websites",
                url: "/when-to-use-isomer/static-websites/",
              },
              {
                type: "single",
                name: "Advance integrations",
                url: "/when-to-use-isomer/advance-integrations/",
              },
            ],
          },
          {
            type: "dropdown",
            name: "Getting Started",
            eventKey: "getting-started",
            links: [
              {
                type: "single",
                name: "What to expect",
                url: "/getting-started/what-to-expect/",
              },
              {
                type: "single",
                name: "Roles & responsibilities",
                url: "/getting-started/roles-and-responsibilities/",
              },
              {
                type: "single",
                name: "FAQs",
                url: "/getting-started/faqs/general/",
              },
            ],
          },
          {
            type: "single",
            name: "Other resources",
            eventKey: "other-resources",
            url: "/other-resources",
          },
        ],
      },
    },
  ],
}
