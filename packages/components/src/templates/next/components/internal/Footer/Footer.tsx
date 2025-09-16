import type { IconType } from "react-icons"
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

import type { FooterProps } from "~/interfaces"
import type {
  FooterItem as FooterItemType,
  SocialMediaType,
} from "~/interfaces/internal/Footer"
import { IsomerLogo } from "~/assets/IsomerLogo"
import { OgpLogo } from "~/assets/OgpLogo"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import {
  focusVisibleHighlight,
  getFormattedDate,
  getReferenceLinkHref,
  isExternalUrl,
} from "~/utils"
import { Link } from "../Link"
import { ClientCopyrightYear } from "./ClientCopyrightYear"

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
  return <h2 className="prose-display-sm">{siteName}</h2>
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

const FooterItem = ({
  LinkComponent,
  title,
  url,
}: FooterItemType & Pick<FooterProps, "LinkComponent">) => {
  if (isExternalUrl(url)) {
    return (
      <Link
        LinkComponent={LinkComponent}
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
      LinkComponent={LinkComponent}
      isWithFocusVisibleHighlight
    >
      {title}
    </Link>
  )
}

const NavSection = ({
  site,
  LinkComponent,
  siteNavItems,
  customNavItems,
}: Pick<
  FooterProps,
  "site" | "LinkComponent" | "siteNavItems" | "customNavItems"
>) => {
  return (
    <div className="prose-body-sm flex flex-col gap-8 lg:flex-row lg:gap-10">
      <div className="flex flex-col gap-3 lg:w-64">
        {siteNavItems.map((item, index) => (
          <FooterItem
            key={index}
            title={item.title}
            url={getReferenceLinkHref(
              item.url,
              site.siteMap,
              site.assetsBaseUrl,
            )}
            LinkComponent={LinkComponent}
          />
        ))}
      </div>
      <div className="flex flex-col gap-3 lg:w-64">
        {customNavItems?.map((item, index) => (
          <FooterItem
            key={index}
            title={item.title}
            url={getReferenceLinkHref(
              item.url,
              site.siteMap,
              site.assetsBaseUrl,
            )}
            LinkComponent={LinkComponent}
          />
        ))}
      </div>
    </div>
  )
}

const SocialMediaSection = ({
  socialMediaLinks,
  site,
  LinkComponent,
}: Pick<FooterProps, "socialMediaLinks" | "site" | "LinkComponent">) => {
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
                site.siteMap,
                site.assetsBaseUrl,
              )}
              isExternal
              label={`${link.type} page`}
              className={footerItemLinkStyle()}
              LinkComponent={LinkComponent}
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
  LinkComponent,
  contactUsLink,
  feedbackFormLink,
}: Pick<
  FooterProps,
  "site" | "LinkComponent" | "contactUsLink" | "feedbackFormLink"
>) => {
  return (
    <div className="prose-body-sm flex flex-col gap-3">
      {contactUsLink && (
        <FooterItem
          title="Contact"
          url={getReferenceLinkHref(
            contactUsLink,
            site.siteMap,
            site.assetsBaseUrl,
          )}
          LinkComponent={LinkComponent}
        />
      )}
      {feedbackFormLink && (
        <FooterItem
          title="Feedback"
          url={getReferenceLinkHref(
            feedbackFormLink,
            site.siteMap,
            site.assetsBaseUrl,
          )}
          LinkComponent={LinkComponent}
        />
      )}
    </div>
  )
}

const ReachUsSection = ({
  site,
  LinkComponent,
  socialMediaLinks,
  contactUsLink,
  feedbackFormLink,
}: Pick<
  FooterProps,
  | "site"
  | "LinkComponent"
  | "socialMediaLinks"
  | "contactUsLink"
  | "feedbackFormLink"
>) => {
  return (
    <div className="flex flex-col gap-6 lg:w-fit">
      <SocialMediaSection
        socialMediaLinks={socialMediaLinks}
        site={site}
        LinkComponent={LinkComponent}
      />
      <ContactUsSection
        site={site}
        LinkComponent={LinkComponent}
        contactUsLink={contactUsLink}
        feedbackFormLink={feedbackFormLink}
      />
    </div>
  )
}

const LegalSection = ({
  site,
  LinkComponent,
  agencyName,
  isGovernment,
  lastUpdated,
  privacyStatementLink,
  termsOfUseLink,
}: Pick<
  FooterProps,
  | "site"
  | "LinkComponent"
  | "agencyName"
  | "isGovernment"
  | "lastUpdated"
  | "privacyStatementLink"
  | "termsOfUseLink"
  | "siteMapLink"
>) => {
  return (
    <div className="flex h-full">
      <div className="flex flex-col justify-end gap-4 lg:gap-2">
        <p className="prose-label-md-regular text-base-content-inverse-subtle">
          <ClientCopyrightYear />{" "}
          {isGovernment ? "Government of Singapore" : agencyName}, last updated{" "}
          {getFormattedDate(lastUpdated)}
        </p>
        <div className="prose-body-sm flex flex-col gap-3 lg:flex-row lg:gap-8">
          {isGovernment && (
            <FooterItem
              title="Report Vulnerability"
              url="https://go.gov.sg/report-vulnerability"
              LinkComponent={LinkComponent}
            />
          )}
          {privacyStatementLink && (
            <FooterItem
              title="Privacy Statement"
              url={getReferenceLinkHref(
                privacyStatementLink,
                site.siteMap,
                site.assetsBaseUrl,
              )}
              LinkComponent={LinkComponent}
            />
          )}
          {termsOfUseLink && (
            <FooterItem
              title="Terms of Use"
              url={getReferenceLinkHref(
                termsOfUseLink,
                site.siteMap,
                site.assetsBaseUrl,
              )}
              LinkComponent={LinkComponent}
            />
          )}
          {isGovernment && (
            <FooterItem
              title="REACH"
              url={"https://www.reach.gov.sg"}
              LinkComponent={LinkComponent}
            />
          )}
        </div>
      </div>
    </div>
  )
}

const CreditsSection = ({
  LinkComponent,
}: Pick<FooterProps, "LinkComponent">) => {
  return (
    <div className="prose-label-md-regular flex flex-col gap-6 lg:flex-row lg:gap-8 xl:gap-20">
      <Link
        href="https://www.isomer.gov.sg"
        isExternal
        className={twMerge(
          footerItemLinkStyle(),
          "group flex flex-col items-start gap-4",
        )}
        LinkComponent={LinkComponent}
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
        LinkComponent={LinkComponent}
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
  LinkComponent,
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
  siteMapLink,
}: FooterProps) => {
  return (
    <div className="flex flex-col gap-8 px-6 py-11 md:px-10 lg:hidden lg:py-16">
      <SiteNameSection siteName={siteName} />
      <NavSection
        siteNavItems={navItems}
        customNavItems={customItems}
        site={site}
        LinkComponent={LinkComponent}
      />
      <ReachUsSection
        socialMediaLinks={socialMediaLinks}
        contactUsLink={contactUsLink}
        feedbackFormLink={feedbackFormLink}
        site={site}
        LinkComponent={LinkComponent}
      />
      <div className="flex flex-col gap-9">
        <LegalSection
          agencyName={agencyName}
          isGovernment={isGovernment}
          lastUpdated={lastUpdated}
          privacyStatementLink={privacyStatementLink}
          termsOfUseLink={termsOfUseLink}
          siteMapLink={siteMapLink}
          site={site}
          LinkComponent={LinkComponent}
        />
        <CreditsSection />
      </div>
    </div>
  )
}

// lg and above
const FooterDesktop = ({
  site,
  LinkComponent,
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
  siteMapLink,
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
              LinkComponent={LinkComponent}
            />
          </div>
          <div>
            <ReachUsSection
              socialMediaLinks={socialMediaLinks}
              contactUsLink={contactUsLink}
              feedbackFormLink={feedbackFormLink}
              site={site}
              LinkComponent={LinkComponent}
            />
          </div>
          <div>
            <LegalSection
              agencyName={agencyName}
              isGovernment={isGovernment}
              lastUpdated={lastUpdated}
              privacyStatementLink={privacyStatementLink}
              termsOfUseLink={termsOfUseLink}
              siteMapLink={siteMapLink}
              site={site}
              LinkComponent={LinkComponent}
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

const Footer = (props: FooterProps) => {
  return (
    <footer className="bg-base-canvas-inverse text-base-content-inverse">
      <FooterMobile {...props} />
      <FooterDesktop {...props} />
    </footer>
  )
}

export default Footer
