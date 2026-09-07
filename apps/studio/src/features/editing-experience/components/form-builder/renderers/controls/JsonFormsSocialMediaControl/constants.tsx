/* oxlint-disable unicorn/no-useless-undefined -- JSON Forms handleChange requires explicit undefined */
import type { FooterSchemaType } from "@opengovsg/isomer-components"
import { Icon } from "@chakra-ui/react"
import { AiFillTikTok } from "react-icons/ai"
import {
  FaFacebook,
  FaGithub,
  FaLinkedin,
  FaSquareXTwitter,
  FaTelegram,
  FaThreads,
  FaYoutube,
} from "react-icons/fa6"
import { IconFlickr, IconInstagram, IconWhatsApp } from "~/components/icons"

interface SocialMediaLink {
  type: NonNullable<FooterSchemaType["socialMediaLinks"]>[number]["type"]
  label: string
  icon: React.ReactNode
  placeholder: string
}

export const SOCIAL_MEDIA_LINKS: SocialMediaLink[] = [
  {
    icon: <Icon as={FaFacebook} fontSize="1.25rem" fill="#0866FF" />,
    label: "Facebook",
    placeholder: "https://www.facebook.com/opengovsg",
    type: "facebook",
  },
  {
    icon: <Icon as={IconFlickr} fontSize="1.25rem" />,
    label: "Flickr",
    placeholder: "https://www.flickr.com/photos/govsingapore",
    type: "flickr",
  },
  {
    icon: <Icon as={FaGithub} fontSize="1.25rem" />,
    label: "GitHub",
    placeholder: "https://www.github.com/opengovsg",
    type: "github",
  },
  {
    icon: <Icon as={IconInstagram} fontSize="1.25rem" />,
    label: "Instagram",
    placeholder: "https://www.instagram.com/opengovsg",
    type: "instagram",
  },
  {
    icon: <Icon as={FaLinkedin} fontSize="1.25rem" fill="#0274B3" />,
    label: "LinkedIn",
    placeholder: "https://www.linkedin.com/company/opengovsg",
    type: "linkedin",
  },
  {
    icon: <Icon as={FaTelegram} fontSize="1.25rem" fill="#26A4E2" />,
    label: "Telegram",
    placeholder: "https://t.me/govsg",
    type: "telegram",
  },
  {
    icon: <Icon as={FaThreads} fontSize="1.25rem" />,
    label: "Threads",
    placeholder: "https://www.threads.net/@gov.sg",
    type: "threads",
  },
  {
    icon: <Icon as={AiFillTikTok} fontSize="1.25rem" fill="#000000" />,
    label: "TikTok",
    placeholder: "https://www.tiktok.com/@opengovsg",
    type: "tiktok",
  },
  {
    icon: <Icon as={IconWhatsApp} fontSize="1.25rem" />,
    label: "WhatsApp",
    placeholder: "https://go.gov.sg/whatsapp",
    type: "whatsapp",
  },
  {
    icon: <Icon as={FaSquareXTwitter} fontSize="1.25rem" />,
    label: "X (Twitter)",
    placeholder: "https://x.com/govsingapore",
    type: "twitter",
  },
  {
    icon: <Icon as={FaYoutube} fontSize="1.25rem" fill="#FF0000" />,
    label: "YouTube",
    placeholder: "https://www.youtube.com/channel/UCuyiflEmkfLfIwOuuN5hAfg/",
    type: "youtube",
  },
]
