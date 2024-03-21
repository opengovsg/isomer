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
import { SocialMediaType } from "~/common/Footer"
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
  return <h3 className={Heading[3]}>{siteName}</h3>
}

const Link = ({ title, url }: { title: string; url: string }) => {
  if (url.startsWith("http")) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="flex gap-1 items-center w-fit hover:underline hover:underline-offset-2"
      >
        {title}
        <BiLinkExternal className="w-[0.875rem] lg:w-[1.5rem] h-auto flex-shrink-0" />
      </a>
    )
  }
  return (
    <a className="w-fit hover:underline hover:underline-offset-2" href={url}>
      {title}
    </a>
  )
}

const NavSection = ({
  siteNavItems,
  customNavItems,
}: Pick<FooterProps, "siteNavItems" | "customNavItems">) => {
  return (
    <div
      className={`flex flex-col gap-12 lg:flex-row lg:gap-16 ${Paragraph[1]}`}
    >
      <div className="flex flex-col gap-5">
        {siteNavItems.map((item) => (
          <Link title={item.title} url={item.url} />
        ))}
      </div>
      <div className="flex flex-col gap-5">
        {customNavItems?.map((item) => (
          <Link title={item.title} url={item.url} />
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
      <h5 className={Heading[5]}>Reach us</h5>
      <div className="flex flex-row gap-7 flex-wrap">
        {socialMediaLinks?.map((link) => {
          const Icon = SocialMediaTypeToIconMap[link.type]
          return (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              <Icon size={26} />
            </a>
          )
        })}
      </div>
    </div>
  )
}

const ContactUsSection = ({
  contactUsLink,
  feedbackFormLink,
}: Pick<FooterProps, "contactUsLink" | "feedbackFormLink">) => {
  return (
    <div className={`flex flex-col gap-3 ${Paragraph[2]}`}>
      {contactUsLink && <Link title="Contact Us" url={contactUsLink} />}
      {feedbackFormLink && (
        <Link title="Feedback Form" url={feedbackFormLink} />
      )}
    </div>
  )
}

const ReachUsSection = ({
  socialMediaLinks,
  contactUsLink,
  feedbackFormLink,
}: Pick<
  FooterProps,
  "socialMediaLinks" | "contactUsLink" | "feedbackFormLink"
>) => {
  return (
    <div className="flex flex-col gap-6 lg:gap-14 lg:w-fit">
      <SocialMediaSection socialMediaLinks={socialMediaLinks} />
      <ContactUsSection
        contactUsLink={contactUsLink}
        feedbackFormLink={feedbackFormLink}
      />
    </div>
  )
}

const LegalSection = ({
  agencyName,
  isGovernment,
  lastUpdated,
  privacyStatementLink,
  termsOfUseLink,
  siteMapLink,
}: Pick<
  FooterProps,
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
        © {new Date().getFullYear()}{" "}
        {isGovernment ? "Government of Singapore" : agencyName}, last updated{" "}
        {lastUpdated}
      </p>
      <div
        className={`flex flex-col gap-3 lg:flex-row lg:gap-8 ${Paragraph[2]}`}
      >
        {isGovernment && (
          <Link
            title="Report Vulnerability"
            url="https://tech.gov.sg/report_vulnerability"
          />
        )}
        {privacyStatementLink && (
          <Link title="Privacy Statement" url={privacyStatementLink} />
        )}
        {termsOfUseLink && <Link title="Terms of Use" url={termsOfUseLink} />}
        {isGovernment && (
          <Link title="Reach" url={"https://www.reach.gov.sg"} />
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
        <IsomerLogo />
      </a>
      <a
        href="https://www.open.gov.sg"
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="flex flex-col gap-4"
      >
        <p>Built by</p>
        <OgpLogo />
      </a>
    </div>
  )
}

// below lg
const FooterMobile = ({
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
      <NavSection siteNavItems={navItems} customNavItems={customItems} />
      <ReachUsSection
        socialMediaLinks={socialMediaLinks}
        contactUsLink={contactUsLink}
        feedbackFormLink={feedbackFormLink}
      />
      <div className="flex flex-col gap-9">
        <LegalSection
          agencyName={agencyName}
          isGovernment={isGovernment}
          lastUpdated={lastUpdated}
          privacyStatementLink={privacyStatementLink}
          termsOfUseLink={termsOfUseLink}
          siteMapLink={siteMapLink}
        />
        <CreditsSection />
      </div>
    </div>
  )
}

// lg and above
const FooterDesktop = ({
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
            <NavSection siteNavItems={navItems} customNavItems={customItems} />
          </div>
          <div>
            <ReachUsSection
              socialMediaLinks={socialMediaLinks}
              contactUsLink={contactUsLink}
              feedbackFormLink={feedbackFormLink}
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
