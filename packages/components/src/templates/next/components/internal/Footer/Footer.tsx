import type { IconType } from "react-icons"
import type { FooterProps } from "~/interfaces"
import type {
  FooterItem as FooterItemType,
  SocialMediaType,
} from "~/interfaces/internal/Footer"
import { BiLinkExternal } from "react-icons/bi"
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa"
import {
  FaFlickr,
  FaTelegram,
  FaThreads,
  FaWhatsapp,
  FaXTwitter,
} from "react-icons/fa6"
import { IoLogoGithub } from "react-icons/io"
import { IsomerLogo } from "~/assets/IsomerLogo"
import { OgpLogo } from "~/assets/OgpLogo"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { getFormattedDate } from "~/utils/getFormattedDate"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"
import { isExternalUrl } from "~/utils/isExternalUrl"
import { focusVisibleHighlight } from "~/utils/tailwind"

import { Link } from "../Link"
import { ClientCopyright } from "./ClientCopyright"

const SocialMediaTypeToIconMap: Record<SocialMediaType, IconType> = {
  facebook: FaFacebook,
  twitter: FaXTwitter,
  instagram: FaInstagram,
  linkedin: FaLinkedin,
  telegram: FaTelegram,
  youtube: FaYoutube,
  github: IoLogoGithub,
  tiktok: FaTiktok,
  whatsapp: FaWhatsapp,
  flickr: FaFlickr,
  threads: FaThreads,
}

const SiteNameSection = ({ siteName }: Pick<FooterProps, "siteName">) => {
  return <h2 className="prose-display-xs">{siteName}</h2>
}

const footerItemLinkStyle = tv({
  extend: focusVisibleHighlight,
  base: "prose-body-sm line-clamp-1 flex w-fit items-center gap-1 text-base-content-inverse outline-none hover:text-base-content-inverse hover:underline hover:underline-offset-4 focus-visible:-m-0.5 focus-visible:p-0.5 focus-visible:shadow-none",
  variants: {
    showExternalIcon: {
      true: `after:content-['_↗']`,
    },
  },
})

const FooterItem = ({ title, url }: FooterItemType) => {
  if (isExternalUrl(url)) {
    return (
      <Link
        href={url}
        isExternal
        className={footerItemLinkStyle()}
        isWithFocusVisibleHighlight
      >
        {title}
        <BiLinkExternal className="h-auto w-3.5 flex-shrink-0 lg:w-4" />
      </Link>
    )
  }
  return (
    <Link
      className={footerItemLinkStyle()}
      href={url}
      isWithFocusVisibleHighlight
    >
      {title}
    </Link>
  )
}

const NavSection = ({
  site,
  siteNavItems,
  customNavItems,
}: Pick<FooterProps, "site" | "siteNavItems" | "customNavItems">) => {
  return (
    <div className="prose-body-sm flex flex-col gap-8 lg:flex-row lg:gap-10">
      <div className="flex flex-col gap-3 lg:w-64">
        {siteNavItems.map((item, index) => (
          <FooterItem
            key={index}
            title={item.title}
            url={
              getReferenceLinkHref(
                item.url,
                site.siteMapArray,
                site.assetsBaseUrl,
              ) ?? item.url
            }
          />
        ))}
      </div>
      <div className="flex flex-col gap-3 lg:w-64">
        {customNavItems?.map((item, index) => (
          <FooterItem
            key={index}
            title={item.title}
            url={
              getReferenceLinkHref(
                item.url,
                site.siteMapArray,
                site.assetsBaseUrl,
              ) ?? item.url
            }
          />
        ))}
      </div>
    </div>
  )
}

const SocialMediaSection = ({
  socialMediaLinks,
  site,
}: Pick<FooterProps, "socialMediaLinks" | "site">) => {
  if (!socialMediaLinks || socialMediaLinks.length === 0) {
    return <></>
  }

  return (
    <div className="flex flex-col gap-5">
      <h3 className="prose-headline-base-medium">Reach us</h3>
      <div className="flex flex-row flex-wrap gap-7">
        {socialMediaLinks.map((link) => {
          const Icon = SocialMediaTypeToIconMap[link.type]
          return (
            <Link
              key={link.url}
              href={getReferenceLinkHref(
                link.url,
                site.siteMapArray,
                site.assetsBaseUrl,
              )}
              isExternal
              label={`${link.type === "twitter" ? "X" : link.type} page`}
              className={footerItemLinkStyle()}
              isWithFocusVisibleHighlight
            >
              <Icon className="h-auto w-6" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}

const ContactUsSection = ({
  site,
  contactUsLink,
  feedbackFormLink,
}: Pick<FooterProps, "site" | "contactUsLink" | "feedbackFormLink">) => {
  return (
    <div className="prose-body-sm flex flex-col gap-3">
      {contactUsLink && (
        <FooterItem
          title="Contact"
          url={
            getReferenceLinkHref(
              contactUsLink,
              site.siteMapArray,
              site.assetsBaseUrl,
            ) ?? contactUsLink
          }
        />
      )}
      {feedbackFormLink && (
        <FooterItem
          title="Feedback"
          url={
            getReferenceLinkHref(
              feedbackFormLink,
              site.siteMapArray,
              site.assetsBaseUrl,
            ) ?? feedbackFormLink
          }
        />
      )}
    </div>
  )
}

const ReachUsSection = ({
  site,
  socialMediaLinks,
  contactUsLink,
  feedbackFormLink,
}: Pick<
  FooterProps,
  "site" | "socialMediaLinks" | "contactUsLink" | "feedbackFormLink"
>) => {
  return (
    <div className="flex flex-col gap-6 lg:w-fit">
      <SocialMediaSection socialMediaLinks={socialMediaLinks} site={site} />
      <ContactUsSection
        site={site}
        contactUsLink={contactUsLink}
        feedbackFormLink={feedbackFormLink}
      />
    </div>
  )
}

const LegalSection = ({
  site,
  agencyName,
  isGovernment,
  lastUpdated,
  privacyStatementLink,
  termsOfUseLink,
}: Pick<
  FooterProps,
  | "site"
  | "agencyName"
  | "isGovernment"
  | "lastUpdated"
  | "privacyStatementLink"
  | "termsOfUseLink"
>) => {
  return (
    <div className="flex h-full">
      <div className="flex flex-col justify-end gap-4 lg:gap-2">
        <p className="prose-label-md-regular text-base-content-inverse-subtle">
          <ClientCopyright
            isGovernment={isGovernment}
            agencyName={agencyName}
            formattedLastUpdated={getFormattedDate(lastUpdated)}
          />
        </p>
        <div className="prose-body-sm flex flex-col gap-3 lg:flex-row lg:gap-8">
          {isGovernment && (
            <FooterItem
              title="Report Vulnerability"
              url="https://go.gov.sg/report-vulnerability"
            />
          )}
          {privacyStatementLink && (
            <FooterItem
              title="Privacy Statement"
              url={
                getReferenceLinkHref(
                  privacyStatementLink,
                  site.siteMapArray,
                  site.assetsBaseUrl,
                ) ?? privacyStatementLink
              }
            />
          )}
          {termsOfUseLink && (
            <FooterItem
              title="Terms of Use"
              url={
                getReferenceLinkHref(
                  termsOfUseLink,
                  site.siteMapArray,
                  site.assetsBaseUrl,
                ) ?? termsOfUseLink
              }
            />
          )}
          {isGovernment && (
            <FooterItem title="REACH" url={"https://www.reach.gov.sg"} />
          )}
        </div>
      </div>
    </div>
  )
}

const CreditsSection = () => {
  return (
    <div className="prose-label-md-regular flex flex-col gap-6 lg:flex-row lg:gap-8 xl:gap-20">
      <Link
        href="https://www.isomer.gov.sg"
        isExternal
        className={twMerge(
          footerItemLinkStyle(),
          "group flex flex-col items-start gap-4",
        )}
        isWithFocusVisibleHighlight
      >
        <p>
          Made with <span className="sr-only">Isomer</span>
        </p>
        <IsomerLogo
          aria-hidden
          className="group-focus-visible:fill-base-content-strong"
        />
      </Link>
      <Link
        href="https://www.open.gov.sg"
        isExternal
        className={twMerge(
          footerItemLinkStyle(),
          "group flex flex-col items-start gap-4",
        )}
        isWithFocusVisibleHighlight
      >
        <p>
          Built by <span className="sr-only">Open Government Products</span>
        </p>
        <OgpLogo
          aria-hidden
          className="group-focus-visible:fill-base-content-strong"
        />
      </Link>
    </div>
  )
}

// below lg
const FooterMobile = ({
  site,
  siteName,
  agencyName,
  isGovernment,
  lastUpdated,
  siteNavItems: navItems,
  customNavItems: customItems,
  socialMediaLinks,
  contactUsLink,
  feedbackFormLink,
  privacyStatementLink,
  termsOfUseLink,
}: FooterProps) => {
  return (
    <div className="flex flex-col gap-8 px-6 py-11 md:px-10 lg:hidden lg:py-16">
      <SiteNameSection siteName={siteName} />
      <NavSection
        siteNavItems={navItems}
        customNavItems={customItems}
        site={site}
      />
      <ReachUsSection
        socialMediaLinks={socialMediaLinks}
        contactUsLink={contactUsLink}
        feedbackFormLink={feedbackFormLink}
        site={site}
      />
      <div className="flex flex-col gap-9">
        <LegalSection
          agencyName={agencyName}
          isGovernment={isGovernment}
          lastUpdated={lastUpdated}
          privacyStatementLink={privacyStatementLink}
          termsOfUseLink={termsOfUseLink}
          site={site}
        />
        <CreditsSection />
      </div>
    </div>
  )
}

// lg and above
const FooterDesktop = ({
  site,
  siteName,
  agencyName,
  isGovernment,
  lastUpdated,
  siteNavItems: navItems,
  customNavItems: customItems,
  socialMediaLinks,
  contactUsLink,
  feedbackFormLink,
  privacyStatementLink,
  termsOfUseLink,
}: FooterProps) => {
  return (
    <div className="hidden px-10 py-14 lg:block">
      <div className="mx-auto flex max-w-[72.5rem] flex-col gap-6">
        <SiteNameSection siteName={siteName} />
        <div className="grid-cols-[1fr_min-content] grid-rows-[1fr_min-content] gap-x-10 gap-y-14 lg:grid">
          <div>
            <NavSection
              siteNavItems={navItems}
              customNavItems={customItems}
              site={site}
            />
          </div>
          <div>
            <ReachUsSection
              socialMediaLinks={socialMediaLinks}
              contactUsLink={contactUsLink}
              feedbackFormLink={feedbackFormLink}
              site={site}
            />
          </div>
          <div>
            <LegalSection
              agencyName={agencyName}
              isGovernment={isGovernment}
              lastUpdated={lastUpdated}
              privacyStatementLink={privacyStatementLink}
              termsOfUseLink={termsOfUseLink}
              site={site}
            />
          </div>
          <div>
            <CreditsSection />
          </div>
        </div>
      </div>
    </div>
  )
}

export const Footer = (props: FooterProps) => {
  return (
    <footer className="bg-base-canvas-inverse text-base-content-inverse">
      <FooterMobile {...props} />
      <FooterDesktop {...props} />
    </footer>
  )
}
