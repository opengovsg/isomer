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
  icon: JSX.Element
  placeholder: string
}

export const SOCIAL_MEDIA_LINKS: SocialMediaLink[] = [
  {
    type: "facebook",
    label: "Facebook",
    icon: <Icon as={FaFacebook} fontSize="1.25rem" fill="#0866FF" />,
    placeholder: "https://www.facebook.com/opengovsg",
  },
  {
    type: "flickr",
    label: "Flickr",
    icon: <Icon as={IconFlickr} fontSize="1.25rem" />,
    placeholder: "https://www.flickr.com/photos/govsingapore",
  },
  {
    type: "github",
    label: "GitHub",
    icon: <Icon as={FaGithub} fontSize="1.25rem" />,
    placeholder: "https://www.github.com/opengovsg",
  },
  {
    type: "instagram",
    label: "Instagram",
    icon: <Icon as={IconInstagram} fontSize="1.25rem" />,
    placeholder: "https://www.instagram.com/opengovsg",
  },
  {
    type: "linkedin",
    label: "LinkedIn",
    icon: <Icon as={FaLinkedin} fontSize="1.25rem" fill="#0274B3" />,
    placeholder: "https://www.linkedin.com/company/opengovsg",
  },
  {
    type: "telegram",
    label: "Telegram",
    icon: <Icon as={FaTelegram} fontSize="1.25rem" fill="#26A4E2" />,
    placeholder: "https://t.me/govsg",
  },
  {
    type: "threads",
    label: "Threads",
    icon: <Icon as={FaThreads} fontSize="1.25rem" />,
    placeholder: "https://www.threads.net/@gov.sg",
  },
  {
    type: "tiktok",
    label: "TikTok",
    icon: <Icon as={AiFillTikTok} fontSize="1.25rem" fill="#000000" />,
    placeholder: "https://www.tiktok.com/@opengovsg",
  },
  {
    type: "whatsapp",
    label: "WhatsApp",
    icon: <Icon as={IconWhatsApp} fontSize="1.25rem" />,
    placeholder: "https://go.gov.sg/whatsapp",
  },
  {
    type: "twitter",
    label: "X (Twitter)",
    icon: <Icon as={FaSquareXTwitter} fontSize="1.25rem" />,
    placeholder: "https://x.com/govsingapore",
  },
  {
    type: "youtube",
    label: "YouTube",
    icon: <Icon as={FaYoutube} fontSize="1.25rem" fill="#FF0000" />,
    placeholder: "https://www.youtube.com/channel/UCuyiflEmkfLfIwOuuN5hAfg/",
  },
]
