import type { Meta, StoryObj } from "@storybook/react-vite"

import type { SearchProps } from "~/interfaces"
import Search from "./Search"

const meta: Meta<SearchProps> = {
  title: "Classic/Components/Search",
  component: Search,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Classic",
    },
  },
}
export default meta
type Story = StoryObj<typeof Search>

// Default scenario
export const Default: Story = {
  args: {
    index: [
      {
        id: "0",
        title: "Our background",
        content:
          "Any public officer can build a good website Our team works on the belief that websites are important ways that the government shares information with citizens. As such, we want to help any public officer to set up a good website easily without any prior coding or design knowledge. We do this by making Isomer the defacto website builder for the government – which enables any public officer to create userfriendly, reliable, costeffective, secure and fast websites.  The vision and mission 🏢 Isomer aims to empower the government to easily and effectively communicate with citizens through our websites. 👪 Citizens should be able to easily find and navigate information on Isomer websites.  Our history Isomer started as an  in 2020.  An internal study conducted by the Singapore government in 2017 found that over onethird of our government websites failed basic usability checks. Problems included website downtime, slow loading speed, and high cost. There was also poor website UX across different devices, and they were hard for citizens with visual disabilities to use. Isomer was created to provide government agencies with a simple and efficient way to create and host static websites. With Isomer, agencies can easily build usable, secure, and fast informational websites without the need for extensive technical expertise or resources.  Our website template has been pretested to ensure usability and accessibility for people with disabilities  Our static site architecture is designed for fast loading and eliminates many vulnerabilities, providing a secure and reliable platform for your website  We use automated monitoring to improve the reliability and security of your website, ensuring that it is always uptodate and protected against potential threats",
        url: "/about-isomer/our-background/",
      },
      {
        id: "1",
        title: "Isomer's infrastructure",
        content:
          "Each Isomer website is actually made up of 2 parts: a staging site and a live site. <br  Staging is like an intermediate version of your live website. It's used to preview content changes and updates without affecting the live website. \t Clicking 'save' on IsomerCMS will reflect the changes on your staging site, but not your live site. \t Page previews in IsomerCMS only allow you to preview that particular page. On your staging site, you can click around and navigate across pages like in your live site. \t You can share your staging site link with colleagues or stakeholders to preview new content, without them having to log into IsomerCMS.   Your live site is publicly accessible to site visitors through your domain. \t A colleague must approve all the changes in staging in order to publish them into your live site. You can do this by Requesting a review on IsomerCMS. \t Note that approval and publishing is for ALL content on your staging site, across all pages. Currently you cannot selectively approve and publish changes for a particular page.",
        url: "/about-isomer/what-is-isomer/isomer-infra/",
      },
      {
        id: "2",
        title: "The Isomer template",
        content:
          "What is the Isomer template? Isomer has a predesigned layout that provides the structure for all websites built with Isomer. It includes lightweight components and templates that users can mix and match in various ways. This keeps a consistent navigation across all Isomer websites by design.  With familiarisation, visitors can find and locate information on any Isomer site quicker Since site visitors don’t have to relearn how to use a website, they save time and frustration – improving their overall site experience. Additionally, it's more accessible for site visitors with disabilities. For example, individuals who rely on screen readers or other assistive technologies to navigate websites benefit from a consistent navigation structure. The repetition makes it easier for them to find and access content. The template UI and its components are derived from the , and follows their standards.   Does this mean that all Isomer websites look the same? Not necessarily. Our research showed that site visitors do perceive Isomer websites differently, and can feel strongly about certain Isomer websites over others. Despite them using the same template and components, content was a bigger differentiator in how they perceived the websites than any specific styling. Interviewees mentioned the types of images used and phrasing or wording when talking about what they liked and disliked about websites.  Some interviewees even noted that they wouldn't have noticed the similarities if not for our research questions.",
        url: "/about-isomer/what-is-isomer/isomer-template/",
      },
      {
        id: "3",
        title: "Our background",
        content:
          "Any public officer can build a good website Our team works on the belief that websites are important ways that the government shares information with citizens. As such, we want to help any public officer to set up a good website easily without any prior coding or design knowledge. We do this by making Isomer the defacto website builder for the government – which enables any public officer to create userfriendly, reliable, costeffective, secure and fast websites.  The vision and mission 🏢 Isomer aims to empower the government to easily and effectively communicate with citizens through our websites. 👪 Citizens should be able to easily find and navigate information on Isomer websites.  Our history Isomer started as an  in 2020.  An internal study conducted by the Singapore government in 2017 found that over onethird of our government websites failed basic usability checks. Problems included website downtime, slow loading speed, and high cost. There was also poor website UX across different devices, and they were hard for citizens with visual disabilities to use. Isomer was created to provide government agencies with a simple and efficient way to create and host static websites. With Isomer, agencies can easily build usable, secure, and fast informational websites without the need for extensive technical expertise or resources.  Our website template has been pretested to ensure usability and accessibility for people with disabilities  Our static site architecture is designed for fast loading and eliminates many vulnerabilities, providing a secure and reliable platform for your website  We use automated monitoring to improve the reliability and security of your website, ensuring that it is always uptodate and protected against potential threats",
        url: "/about-isomer/our-background/",
      },
      {
        id: "4",
        title: "Isomer's infrastructure",
        content:
          "Each Isomer website is actually made up of 2 parts: a staging site and a live site. <br  Staging is like an intermediate version of your live website. It's used to preview content changes and updates without affecting the live website. \t Clicking 'save' on IsomerCMS will reflect the changes on your staging site, but not your live site. \t Page previews in IsomerCMS only allow you to preview that particular page. On your staging site, you can click around and navigate across pages like in your live site. \t You can share your staging site link with colleagues or stakeholders to preview new content, without them having to log into IsomerCMS.   Your live site is publicly accessible to site visitors through your domain. \t A colleague must approve all the changes in staging in order to publish them into your live site. You can do this by Requesting a review on IsomerCMS. \t Note that approval and publishing is for ALL content on your staging site, across all pages. Currently you cannot selectively approve and publish changes for a particular page.",
        url: "/about-isomer/what-is-isomer/isomer-infra/",
      },
      {
        id: "5",
        title: "The Isomer template",
        content:
          "What is the Isomer template? Isomer has a predesigned layout that provides the structure for all websites built with Isomer. It includes lightweight components and templates that users can mix and match in various ways. This keeps a consistent navigation across all Isomer websites by design.  With familiarisation, visitors can find and locate information on any Isomer site quicker Since site visitors don’t have to relearn how to use a website, they save time and frustration – improving their overall site experience. Additionally, it's more accessible for site visitors with disabilities. For example, individuals who rely on screen readers or other assistive technologies to navigate websites benefit from a consistent navigation structure. The repetition makes it easier for them to find and access content. The template UI and its components are derived from the , and follows their standards.   Does this mean that all Isomer websites look the same? Not necessarily. Our research showed that site visitors do perceive Isomer websites differently, and can feel strongly about certain Isomer websites over others. Despite them using the same template and components, content was a bigger differentiator in how they perceived the websites than any specific styling. Interviewees mentioned the types of images used and phrasing or wording when talking about what they liked and disliked about websites.  Some interviewees even noted that they wouldn't have noticed the similarities if not for our research questions.",
        url: "/about-isomer/what-is-isomer/isomer-template/",
      },
      {
        id: "6",
        title: "The Isomer template",
        content:
          "What is the Isomer template? Isomer has a predesigned layout that provides the structure for all websites built with Isomer. It includes lightweight components and templates that users can mix and match in various ways. This keeps a consistent navigation across all Isomer websites by design.  With familiarisation, visitors can find and locate information on any Isomer site quicker Since site visitors don’t have to relearn how to use a website, they save time and frustration – improving their overall site experience. Additionally, it's more accessible for site visitors with disabilities. For example, individuals who rely on screen readers or other assistive technologies to navigate websites benefit from a consistent navigation structure. The repetition makes it easier for them to find and access content. The template UI and its components are derived from the , and follows their standards.   Does this mean that all Isomer websites look the same? Not necessarily. Our research showed that site visitors do perceive Isomer websites differently, and can feel strongly about certain Isomer websites over others. Despite them using the same template and components, content was a bigger differentiator in how they perceived the websites than any specific styling. Interviewees mentioned the types of images used and phrasing or wording when talking about what they liked and disliked about websites.  Some interviewees even noted that they wouldn't have noticed the similarities if not for our research questions.",
        url: "/about-isomer/what-is-isomer/isomer-template/",
      },
    ],
  },
}
