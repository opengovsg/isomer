import { Footer } from "@govtechsg/sgds-react/Footer"

import type { FooterProps } from "~/interfaces"

const IsomerFooter = ({ agencyName, siteNavItems }: FooterProps) => {
  return (
    <Footer>
      <Footer.Top>
        <Footer.Top.Header headerTitle={agencyName} />
        <Footer.Top.ItemGroup>
          {siteNavItems.map((item) => {
            return (
              <Footer.Top.Item key={`footer-item-${item.title}`}>
                <a href={item.url} className="-mt-8 font-bold">
                  {item.title}
                </a>
                {/* {item.subItems?.map((subItem) => {
                  return (
                    <a
                      href={subItem.link}
                      key={`footer-subitem-${subItem.title}`}
                    >
                      {subItem.title}
                    </a>
                  )
                })} */}
              </Footer.Top.Item>
            )
          })}
        </Footer.Top.ItemGroup>
        <Footer.Top.ContactLinks>
          <a href="">Contact</a>
          <a href="">Feedback</a>
          <a
            href="https://www.reach.gov.sg/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Reach.gov.sg
          </a>
        </Footer.Top.ContactLinks>
      </Footer.Top>
      <Footer.Bottom>
        <Footer.Bottom.Links>
          <a
            href="https://go.gov.sg/report-vulnerability"
            target="_blank"
            rel="noopener noreferrer"
          >
            Report Vulnerability
          </a>
          <a href="">Privacy</a>
          <a href="">Terms of use</a>
        </Footer.Bottom.Links>
        {/* <Footer.Bottom.Copyrights>
          © {`${new Date().getFullYear()}`} {`${agencyName}`}. Last Updated{" "}
          {lastUpdated}`
        </Footer.Bottom.Copyrights> */}
      </Footer.Bottom>
    </Footer>
  )
}

export default IsomerFooter
