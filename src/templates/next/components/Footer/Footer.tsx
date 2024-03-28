import { IconType } from "react-icons"
import { BiLinkExternal } from "react-icons/bi"
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa"
import { FaTelegram, FaXTwitter } from "react-icons/fa6"
import { IoLogoGithub } from "react-icons/io"
import { IsomerLogo } from "~/assets/IsomerLogo"
import { OgpLogo } from "~/assets/OgpLogo"
import { FooterProps } from "~/common"
import { FooterItem as FooterItemType, SocialMediaType } from "~/common/Footer"
import { Caption } from "../../typography/Caption"
import { Heading } from "../../typography/Heading"
import { Paragraph } from "../../typography/Paragraph"

const SocialMediaTypeToIconMap: Record<SocialMediaType, IconType> = {
  facebook: FaFacebook,
  twitter: FaXTwitter,
  instagram: FaInstagram,
  linkedin: FaLinkedin,
  telegram: FaTelegram,
  youtube: FaYoutube,
  github: IoLogoGithub,
  tiktok: FaTiktok,
}

const SiteNameSection = ({ siteName }: Pick<FooterProps, "siteName">) => {
  return <h2 className={Heading[3]}>{siteName}</h2>
}

const FooterItem = ({
  LinkComponent = "a",
  title,
  url,
}: FooterItemType & Pick<FooterProps, "LinkComponent">) => {
  if (url.startsWith("http")) {
    return (
      <LinkComponent
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="flex gap-1 items-center w-fit hover:underline hover:underline-offset-2"
      >
        {title}
        <BiLinkExternal className="w-[0.875rem] lg:w-[1.5rem] h-auto flex-shrink-0" />
      </LinkComponent>
    )
  }
  return (
    <a className="w-fit hover:underline hover:underline-offset-2" href={url}>
      {title}
    </a>
  )
}

const NavSection = ({
  LinkComponent,
  siteNavItems,
  customNavItems,
}: Pick<FooterProps, "LinkComponent" | "siteNavItems" | "customNavItems">) => {
  return (
    <div
      className={`flex flex-col gap-12 lg:flex-row lg:gap-16 ${Paragraph[1]}`}
    >
      <div className="flex flex-col gap-5">
        {siteNavItems.map((item) => (
          <FooterItem
            title={item.title}
            url={item.url}
            LinkComponent={LinkComponent}
          />
        ))}
      </div>
      <div className="flex flex-col gap-5">
        {customNavItems?.map((item) => (
          <FooterItem
            title={item.title}
            url={item.url}
            LinkComponent={LinkComponent}
          />
        ))}
      </div>
    </div>
  )
}

const SocialMediaSection = ({
  socialMediaLinks,
}: Pick<FooterProps, "socialMediaLinks">) => {
  return (
    <div className="flex flex-col gap-5">
      <h3 className={Heading[5]}>Reach us</h3>
      <div className="flex flex-row gap-7 flex-wrap">
        {socialMediaLinks?.map((link) => {
          const Icon = SocialMediaTypeToIconMap[link.type]
          return (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              aria-label={`${link.type} page`}
            >
              <Icon className="w-[1.625rem] h-auto" />
            </a>
          )
        })}
      </div>
    </div>
  )
}

const ContactUsSection = ({
  LinkComponent,
  contactUsLink,
  feedbackFormLink,
}: Pick<
  FooterProps,
  "LinkComponent" | "contactUsLink" | "feedbackFormLink"
>) => {
  return (
    <div className={`flex flex-col gap-3 ${Paragraph[2]}`}>
      {contactUsLink && (
        <FooterItem
          title="Contact Us"
          url={contactUsLink}
          LinkComponent={LinkComponent}
        />
      )}
      {feedbackFormLink && (
        <FooterItem
          title="Feedback Form"
          url={feedbackFormLink}
          LinkComponent={LinkComponent}
        />
      )}
    </div>
  )
}

const ReachUsSection = ({
  LinkComponent,
  socialMediaLinks,
  contactUsLink,
  feedbackFormLink,
}: Pick<
  FooterProps,
  "LinkComponent" | "socialMediaLinks" | "contactUsLink" | "feedbackFormLink"
>) => {
  return (
    <div className="flex flex-col gap-6 lg:gap-14 lg:w-fit">
      <SocialMediaSection socialMediaLinks={socialMediaLinks} />
      <ContactUsSection
        LinkComponent={LinkComponent}
        contactUsLink={contactUsLink}
        feedbackFormLink={feedbackFormLink}
      />
    </div>
  )
}

const LegalSection = ({
  LinkComponent,
  agencyName,
  isGovernment,
  lastUpdated,
  privacyStatementLink,
  termsOfUseLink,
  siteMapLink,
}: Pick<
  FooterProps,
  | "LinkComponent"
  | "agencyName"
  | "isGovernment"
  | "lastUpdated"
  | "privacyStatementLink"
  | "termsOfUseLink"
  | "siteMapLink"
>) => {
  return (
    <div className="flex flex-col gap-8 lg:gap-2">
      <p className={`text-content-inverse-light ${Paragraph[2]}`}>
        &copy; {new Date().getFullYear()}{" "}
        {isGovernment ? "Government of Singapore" : agencyName}, last updated{" "}
        {lastUpdated}
      </p>
      <div
        className={`flex flex-col gap-3 lg:flex-row lg:gap-8 ${Paragraph[2]}`}
      >
        {isGovernment && (
          <FooterItem
            title="Report Vulnerability"
            url="https://tech.gov.sg/report_vulnerability"
            LinkComponent={LinkComponent}
          />
        )}
        {privacyStatementLink && (
          <FooterItem
            title="Privacy Statement"
            url={privacyStatementLink}
            LinkComponent={LinkComponent}
          />
        )}
        {termsOfUseLink && (
          <FooterItem
            title="Terms of Use"
            url={termsOfUseLink}
            LinkComponent={LinkComponent}
          />
        )}
        {isGovernment && (
          <FooterItem
            title="Reach"
            url={"https://www.reach.gov.sg"}
            LinkComponent={LinkComponent}
          />
        )}
      </div>
    </div>
  )
}

const CreditsSection = () => {
  return (
    <div
      className={`flex flex-col gap-9 lg:flex-row lg:gap-10 xl:gap-20 ${Caption[1]}`}
    >
      <a
        href="https://www.isomer.gov.sg"
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="flex flex-col gap-4"
      >
        <p>Made with</p>
        <IsomerLogo aria-label="isomer-logo" />
      </a>
      <a
        href="https://www.open.gov.sg"
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="flex flex-col gap-4"
      >
        <p>Built by</p>
        <OgpLogo aria-label="ogp-logo" />
      </a>
    </div>
  )
}

// below lg
const FooterMobile = ({
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
    <div className="flex flex-col gap-16 py-16 px-6 md:p-20 lg:hidden ">
      <SiteNameSection siteName={siteName} />
      <NavSection
        siteNavItems={navItems}
        customNavItems={customItems}
        LinkComponent={LinkComponent}
      />
      <ReachUsSection
        socialMediaLinks={socialMediaLinks}
        contactUsLink={contactUsLink}
        feedbackFormLink={feedbackFormLink}
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
          LinkComponent={LinkComponent}
        />
        <CreditsSection />
      </div>
    </div>
  )
}

// lg and above
const FooterDesktop = ({
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
    <div className="hidden lg:block py-[6.75rem] px-[4rem]">
      <div className="flex flex-col gap-14 max-w-[72.5rem] mx-auto">
        <SiteNameSection siteName={siteName} />
        <div className="lg:grid grid-rows-[1fr_min-content] grid-cols-[1fr_min-content] gap-y-16 gap-x-16">
          <div>
            <NavSection
              siteNavItems={navItems}
              customNavItems={customItems}
              LinkComponent={LinkComponent}
            />
          </div>
          <div>
            <ReachUsSection
              socialMediaLinks={socialMediaLinks}
              contactUsLink={contactUsLink}
              feedbackFormLink={feedbackFormLink}
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
    <footer className="bg-canvas-inverse text-content-inverse">
      <FooterMobile {...props} />
      <FooterDesktop {...props} />
    </footer>
  )
}

export default Footer
