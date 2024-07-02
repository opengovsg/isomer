import { IconType } from "react-icons";
import { BiLinkExternal } from "react-icons/bi";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa";
import { FaTelegram, FaXTwitter } from "react-icons/fa6";
import { IoLogoGithub } from "react-icons/io";

import type { FooterProps } from "~/interfaces";
import type {
  FooterItem as FooterItemType,
  SocialMediaType,
} from "~/interfaces/internal/Footer";
import { IsomerLogo } from "~/assets/IsomerLogo";
import { OgpLogo } from "~/assets/OgpLogo";

const SocialMediaTypeToIconMap: Record<SocialMediaType, IconType> = {
  facebook: FaFacebook,
  twitter: FaXTwitter,
  instagram: FaInstagram,
  linkedin: FaLinkedin,
  telegram: FaTelegram,
  youtube: FaYoutube,
  github: IoLogoGithub,
  tiktok: FaTiktok,
};

const SiteNameSection = ({ siteName }: Pick<FooterProps, "siteName">) => {
  return <h2 className="text-heading-04">{siteName}</h2>;
};

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
        className="line-clamp-1 flex w-fit items-center gap-1 hover:underline hover:underline-offset-2"
      >
        {title}
        <BiLinkExternal className="h-auto w-3.5 flex-shrink-0 lg:w-4" />
      </LinkComponent>
    );
  }
  return (
    <a
      className="line-clamp-1 w-fit hover:underline hover:underline-offset-2"
      href={url}
    >
      {title}
    </a>
  );
};

const NavSection = ({
  LinkComponent,
  siteNavItems,
  customNavItems,
}: Pick<FooterProps, "LinkComponent" | "siteNavItems" | "customNavItems">) => {
  return (
    <div className="flex flex-col gap-8 text-caption-01 lg:flex-row lg:gap-12">
      <div className="flex flex-col gap-3 lg:w-64">
        {siteNavItems.map((item) => (
          <FooterItem
            title={item.title}
            url={item.url}
            LinkComponent={LinkComponent}
          />
        ))}
      </div>
      <div className="flex flex-col gap-3 lg:w-64">
        {customNavItems?.map((item) => (
          <FooterItem
            title={item.title}
            url={item.url}
            LinkComponent={LinkComponent}
          />
        ))}
      </div>
    </div>
  );
};

const SocialMediaSection = ({
  socialMediaLinks,
}: Pick<FooterProps, "socialMediaLinks">) => {
  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-subheading-01">Reach us</h3>
      <div className="flex flex-row flex-wrap gap-7">
        {socialMediaLinks?.map((link) => {
          const Icon = SocialMediaTypeToIconMap[link.type];
          return (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              aria-label={`${link.type} page`}
            >
              <Icon className="h-auto w-6" />
            </a>
          );
        })}
      </div>
    </div>
  );
};

const ContactUsSection = ({
  LinkComponent,
  contactUsLink,
  feedbackFormLink,
}: Pick<
  FooterProps,
  "LinkComponent" | "contactUsLink" | "feedbackFormLink"
>) => {
  return (
    <div className="flex flex-col gap-3 text-caption-01">
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
  );
};

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
    <div className="flex flex-col gap-6 lg:w-fit">
      <SocialMediaSection socialMediaLinks={socialMediaLinks} />
      <ContactUsSection
        LinkComponent={LinkComponent}
        contactUsLink={contactUsLink}
        feedbackFormLink={feedbackFormLink}
      />
    </div>
  );
};

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
    <div className="flex h-full">
      <div className="flex flex-col justify-end gap-4 lg:gap-2">
        <p className="text-content-inverse-light text-caption-01">
          &copy; {new Date().getFullYear()}{" "}
          {isGovernment ? "Government of Singapore" : agencyName}, last updated{" "}
          {lastUpdated}
        </p>
        <div className="flex flex-col gap-3 text-caption-01 lg:flex-row lg:gap-8">
          {isGovernment && (
            <FooterItem
              title="Report Vulnerability"
              url="https://tech.gov.sg/report-vulnerability"
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
    </div>
  );
};

const CreditsSection = () => {
  return (
    <div className="flex flex-col gap-6 text-caption-01 lg:flex-row lg:gap-8 xl:gap-20">
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
  );
};

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
    <div className="flex flex-col gap-14 px-6 py-16 md:p-20 lg:hidden ">
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
  );
};

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
    <div className="hidden px-[4rem] py-14 lg:block">
      <div className="mx-auto flex max-w-[72.5rem] flex-col gap-6">
        <SiteNameSection siteName={siteName} />
        <div className="grid-cols-[1fr_min-content] grid-rows-[1fr_min-content] gap-x-8 gap-y-14 lg:grid">
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
  );
};

const Footer = (props: FooterProps) => {
  return (
    <footer className="bg-canvas-inverse text-content-inverse">
      <FooterMobile {...props} />
      <FooterDesktop {...props} />
    </footer>
  );
};

export default Footer;
