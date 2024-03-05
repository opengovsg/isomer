import { useState } from "react"
import { Navbar, Nav, NavDropdown } from "@govtechsg/sgds-react"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { NavbarProps } from "~/common"

export const IsomerNav = ({
  logo,
  links,
  search = { isEnabled: false },
}: NavbarProps) => {
  const [active, setActive] = useState("home")
  const clickNavbarItem = (eventKey: string) => {
    setActive(eventKey)
  }
  return (
    <Navbar expand="md">
      <Navbar.Brand href="/">
        <img src={logo.url} alt={logo.alt} />
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="me-auto" navbarScroll activeKey={active}>
          {links.map((link) => {
            if (link.type === "dropdown") {
              return (
                <NavDropdown
                  title={link.name}
                  id="basic-nav-dropdown"
                  eventKey={link.eventKey}
                  key={link.name}
                >
                  {link.links?.map((sublink) => {
                    return (
                      <NavDropdown.Item href={sublink.url} key={sublink.name}>
                        {sublink.name}
                      </NavDropdown.Item>
                    )
                  })}
                </NavDropdown>
              )
            }
            return (
              <Nav.Item key={link.name}>
                <Nav.Link href={link.url} eventKey={link.eventKey}>
                  {link.name}
                </Nav.Link>
              </Nav.Item>
            )
          })}
        </Nav>
      </Navbar.Collapse>
      {search.isEnabled && (
        <Nav>
          <Nav.Item>
            <Nav.Link eventKey={"search"}>
              <a href={search.searchUrl}>
                <MagnifyingGlassIcon className="text-secondary h-5 w-5 ml-1 mt-1" />
              </a>
            </Nav.Link>
          </Nav.Item>
        </Nav>
      )}
    </Navbar>
  )
}

export default IsomerNav
