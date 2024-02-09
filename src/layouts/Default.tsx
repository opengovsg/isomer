import { RenderEngine } from ".."
import { Navbar } from "../config/navbar"
import { Footer } from "../config/footer"

export interface DefaultLayoutProps {
  children: JSX.Element[]
}
export const DefaultLayout = ({ children }: DefaultLayoutProps) => {
  return (
    <>
      <RenderEngine id={Navbar.id} components={Navbar.components} />
      {...children}
      <RenderEngine id={Footer.id} components={Footer.components} />
    </>
  )
}

export default DefaultLayout
