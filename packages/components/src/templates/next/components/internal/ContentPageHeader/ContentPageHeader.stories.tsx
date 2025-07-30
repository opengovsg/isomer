import type { Meta, StoryObj } from "@storybook/react"

import type { ContentPageHeaderProps } from "~/interfaces"
import ContentPageHeader from "./ContentPageHeader"

const meta: Meta<ContentPageHeaderProps> = {
  title: "Next/Internal Components/ContentPageHeader",
  component: ContentPageHeader,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  args: {
    site: {
      siteName: "Isomer Next",
      siteMap: {
        id: "1",
        title: "Home",
        permalink: "/",
        lastModified: "",
        layout: "homepage",
        summary: "",
        children: [],
      },
      theme: "isomer-next",
      isGovernment: true,
      url: "https://www.isomer.gov.sg",
      logoUrl: "/isomer-logo.svg",
      lastUpdated: "2021-10-01",
      navbar: { items: [] },
      footerItems: {
        privacyStatementLink: "https://www.isomer.gov.sg/privacy",
        termsOfUseLink: "https://www.isomer.gov.sg/terms",
        siteNavItems: [],
      },
      search: {
        type: "localSearch",
        searchUrl: "/search",
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ContentPageHeader>

export const Default: Story = {
  args: {
    title: "Steven Pinker’s Steven Pinker’s Rationality",
    summary:
      "Steven Pinker's exploration of rationality delves into the intricacies of human cognition, shedding light on the mechanisms behind our decision-making processes. Through empirical research and insightful analysis, Pinker illuminates the rationality that underpins human behavior, challenging conventional wisdom and offering new perspectives on the rational mind.",
    breadcrumb: {
      links: [
        {
          title: "Irrationality",
          url: "/irrationality",
        },
        {
          title: "For Individuals",
          url: "/irrationality/individuals",
        },
        {
          title: "Steven Pinker's Rationality",
          url: "/irrationality/individuals/pinker-rationality",
        },
      ],
    },
    showThumbnail: false,
    buttonLabel: "Submit a proposal",
    buttonUrl: "/",
  },
}

export const WithImage: Story = {
  args: {
    title: "Steven Pinker’s Steven Pinker’s Rationality",
    summary:
      "Steven Pinker's exploration of rationality delves into the intricacies of human cognition, shedding light on the mechanisms behind our decision-making processes. Through empirical research and insightful analysis, Pinker illuminates the rationality that underpins human behavior, challenging conventional wisdom and offering new perspectives on the rational mind.",
    breadcrumb: {
      links: [
        {
          title: "Irrationality",
          url: "/irrationality",
        },
        {
          title: "For Individuals",
          url: "/irrationality/individuals",
        },
        {
          title: "Steven Pinker's Rationality",
          url: "/irrationality/individuals/pinker-rationality",
        },
      ],
    },
    buttonLabel: "Submit a proposal",
    buttonUrl: "/",
    showThumbnail: true,
    image: {
      src: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBUQEBAVFhAVGBUVFRYVFhUWFRUVFxYWFhUYFhUYHSggGBomHRUVITEhJSkrLi4uFyAzODMsNygtLisBCgoKDg0OGhAQGi0lHSUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSstLS0tLS0tLSstLf/AABEIALcBEwMBIgACEQEDEQH/xAAbAAABBQEBAAAAAAAAAAAAAAACAAEDBAUGB//EAD4QAAEDAgMFBQUHAwQCAwAAAAEAAhEDIQQSMQVBUWFxEyKBkaEGMkKxwRRSYpLR4fAjcoIzorLxFdIHJEP/xAAZAQEAAwEBAAAAAAAAAAAAAAAAAQIDBAX/xAAjEQEBAAICAgIDAAMAAAAAAAAAAQIRAyESMTJBBCJRE2Fx/9oADAMBAAIRAxEAPwDEKSGUgV0s0gRSowUQKA0JSlMUQjcgKNyGESYJ0kxQJMmlOgcIwUARBBICjlQgopQHKEppTEoI6gUDlYeoCoDNUoKiRNKJSApnJgUiVIByicFI4oCoELkClcFEoSeUJKdCVAZMU6YoGKEpyhKB0yUpkG6UkimV1RgowVGEQKA0JKUpkDFMnKZAkJTymKACknKZQCCIIAiBUgk8oZSlA6SElDKBygISKNjs1ioSiTIqghAgMFIlCEkAlMSpsRhnsDXOaQHAlpO8CygKhISoyFIUJQRlCVIQgKgCmKdCUDFAURQoGTpkkG4SlKElDKuqkBRAqHMnzIJpTyocyIFAcpimBRNDTq6OokeiAJSDlJ2PB7PMj5gJjh3boPRzT9VAaXbjPz8kzavEA+H6JnUXi+V3WD80TKjXWfY/eGviN/z6oD7Np0seB08EJpHxRvoGBvPwkaPA1g8Rw1RYern7h13Hn14/NShAWkai3ohlWX1XU3QfMfEOY3+KGsGEZhod40HJw3eChKCUxTPBGv7HoUOZEmlInemDgbFWMNgatTMGU3OLYmGkx18FAKrBph/4i0+In6E+KqkLeoeztd1GCwtcXh0EGcuThu97fpCq4jYNemGksMuJAABJH9x0B1so8oKmCwVSs7LTaSfQdVsYXYcVA0nMcpMjSQbrpfZvCdiWtLIzNyunUHW/BbLNlta8Fo1j1tIUZZaiZN1wXtwAx9CkPhpAnq4k/RcwSum/+QCDi3Eae6OjYHzlcuVXj+EWz+VPKZCp8PhKlQwxhceAEnqr7VQlA5Wcfg6lAtFVjm5pyyLGNYKrFRLL6LNAKAoihUhihKcoCUDykhlJBtEoSUpQlWVPKUoZTIlIHIgVFKcFBLKUoWSdBPhKkAeOA6loRCMuSlTh7x/+rfOfkCjFZ299E9WD55J9UFUOIu0nwsUYxjviAcPxCT+bX1VkZHe9TZ1p1g0+VQmellKNlB47pJ/uGU/mGZh/MERsODxDNBodWPMAncWVPhcNxPmjxmE1cJiQMxEQ46Nqj4XcHDuu81Wq7JqNE/8AKB4B85D4OUuDx9TDuDarCWxlhw+E6gTZzfwm3CDdD/icU+2pkOEVG+cxPk4CerfxLOw1KoX5abXOdeQ0EmN+i6PB4XM9r8P3qbzlyzLqckd5rjctBg3u0gSDIcsnHYmpSxGfD4es9ge5rqlFjyGZIDgQAYE8dQJuFTkz8Zue1+LGZZat6W6Hs9inCOwcAb/Dbg5omQeI3rPfsbFB2Q4epm/sMeei6YbfFcjs3gxrljM3cZad8iI1uuh2TtvKxxr5gxrWEOfAzAgSY4ibrjn5We9WR15fjY6/W1y2yfZMBufExmvDZkTuDuMzoF0OJpMYOzZULXloaG07AAWEQbGd53rcw1bA4uCyuA2M1iBI036id6HaX/jsJTL+0YIvJcCRGkKcsvLu1nMdX0xMHhjSIZXrNIN+/Jho1JJOv6FaFTE5f9Gq12WYbYATJ3b1wY9vNkVMUX1mF5JDQ9zZYBcDXTU35rtnU8M8f6AG8Fgyz4jULPdi/jGUfaNzXHtsM8En3g25m0tLdCtmht+m4OLXd5jSYOuaNJ36hV8FPeFQNN7TBOUz+/8A0qNPZobWIkmZiQAIgx1P7dVbzutK+M25L2qJLmWMkGSbTdYTWFxDQJJsAF2m0/Z/EV5+K9iZj52HmrXs77PNpOBqEZrTxuQAOWoW2HLJjIrlhbdsjZXso6z6+lrbvE/T/pXsfWbSZkYMrXXsO86JEnlfTkusx7qlMd0AgTIAtljePDouS2zQa6HZYPdBaDYGLEWuLctCqcmVq/FjGFtPE9rhXjcyoxw5SSPk5YRK19osyUHn79Sm0eAe8/8AELGJWvD8WfN8jFCnKZbMglRuUpUbggBJNCSgbKYoiEJV0GTJFCSgKUQf0UUpsyCc1CdShlRzzSnmgOUTY0kR8ud1FmHFSU2g8Y4nT5ogRwr5gNJ4Ze9I4iEww9UH3XNPE931MK1SxtNggszjmbA8W/oQrY2viY/oVIb92mMjh4CfNEdnwL9oNuyXDmab7dSZ9Vs0K9TLFfBujf2YGXr2feHjCwW7ZxR1rFx4OaHeZYC75I243FON2Ej8NSq2f8c8D8qHja6vYNTD0HmpSBaT8JEX0u0m2p0XQjGMpYeaVKcsuNOnZ0udLnDiTmzeJXnuGpvDM3ZvbeZNSm6/GC0FbQxGem17KtQVaOVxaGgh7BZzcucA2MSd5BWPP8W/Dj+yfFbUc5v2ptKk/DuEufPZ1WNmznipZzREWvbqnxGzqeNDazTLTIgkkRBBgixlswrWGoBtWnjcPQpmjiA1mJDwW1WtI7hN4IEwQRMEXgK77K0m5alJhp9jmd2JpCGdnZuWJIkQRbhovPskvTt7sU9i+y1Bwe2lVDan3crSW20uJiy8/wBoexmJdUxdTFB5ZQEtaJc+q4iWlvBkA213Bd+zCVG13kEkktIIyj3oFh/jEz8S1W7WORvasD4sXHuuGgEOF807oC0wzsmts+TC2de3gGx/YzHYyoGNo9k12Yh1Udm2wJjSZMcF7h7EVjiNn0nPANRg7OoN4fTJY6d8y0nxWhgquGfYUMoJgHv39bHTVQ1W08HX7LDsY1mIlxaG5QagAku0u7edbK+fLjcfTPi485f2pzSl5OUgjibRpPldUMZTcXguqRTAOgMuO7kOg+7M2Ebn2cakQ43IdcTxuLb1mYwkgnK0wZaL33akdNFhGth6jA+npIA0JItHmq+AxJpODnNHu6QblsF1zfQ+hTvxTWMGeADxMEnfF5SbiWdkAwSSPA2IuOCtx+0ZTpM/GhtUwe45wAv950Houa2ticzncRbwkn5ptqVS1xAnWeYvI8dE2FoB731qlqTSXOPETp9I5rW22LY4yML2nlrKLOOZ5HMwB6T5rAJW17V1C+o1xFyLf2z3R5fJY9KmXGAJXRxWeErk5ZfOglWqGBc4ToOK1tm7Ghpc9t1q0MGHQ2Ibr1WfJ+RJ6a8f49vtz2D2Q59yrVbZzGw0Nl29dOaWVttdAoMFgMveN3Lly5s8q6seDDGMI7DngkulyncBHRJU8sv6v4Y/xxZQEpyUJXsPIC4qMlE5RuQPKaUKYlQHLk3Ux80JchjmEEnagaDzv6JdoTqVFkPLzCcU3cEE2ZNmSbQedwHVzR8ypBhfvVaTf8s3/AOQF9tebOh/97Q4/mN/VP29Me9QZ4OePQuKZraDfeqPeeDG5R+d9/8AanbjA3/TptZzP9R/m6w6hoKDYoMD6Ob7OwM+9Ue/KehzDN0Enko3bUfg3irRAk90BjMrY5uI7SoJ3S26hwNR1Z2Uuc95+8Sfmuhwez2uYXNIc4av1vwZx5u4ac88ptpjdKeyH4gZywy+u4mpBAZTgRBb9+/+O+5tr7OrvovDXugFwqBzWgNzGZmLCbzC5+nTfgqudrSWXlu4zf1MK/R9qmVYb2cPvLY3CD0XDy4XbswzbLsex7nUs1jLZHwze3FpO7dPRbVOhULQ0OGcgOl3u1A24dI3wfe19VxmMDQ41adg4zGoB3yFvbK20HZWPcTZ2WLxImAT5+azvXtadr7KNVriDIBNrh0HUQd8x/As3aeIeMdRdUzBosAbGeINwZsuvqYcPoteBJAETY20g8eXJcn7bPmkLOEQ4RBaYIP86qNG3Vl0jfHHlvWbVwZBNswNgdD8+ir7JxQNJkkmwvIjS+gWw1jSO8CQRuTGosc5WwDXn3CXDeXW4+8QfQKKpmpktp0nVHFoAAktBGv8C0K9SnQeGG7ibTAhuvyWTtL2rq06uRlKn2IF3S4vN9BlO6D+y1xykRq/SvisC8Ga+VhIEk342AFyYhYOK2i+tVFFjHNw1JwygxNR0GXu47uk8VFtjbr3uz58o7xgAZr8SbDX0Whg9kzTbWe85iQ4CSRHAc/0UZ59drzGfRe0WyRUFNzRcWd03J8Hs1tETHnqStnFVWinO6Lm+o3EblhYnHkm5VP8l8dJnHPLbUbXB0ieCVN8GAZ4wsKjig4nhdXdmvAdE67+Cy8tNtb9NpjwTDinq1w0wB1PJZLaoDpnep61cPIzNDGDrJ6pLftayfS+MRS5+aSq06IImElPkjxcPmTyoA5GHL23iCKjcEWZCSgAoCjKAqEhKFEU0KABCEhSEISEAhEChUoouiSIHF1h66+CAJU2Hw5fJsGjVxs0dTx5C6Wam38Z8Ws/U+iCriHPiTYaAWaOgFgiF9mLawZKUwbOcbOfyj4W8vMm0dB7P7RIdHwmBHDeVx7LrX2XTc0h0quS0d9icM2o0uIEed+Swf8AxNMO7Q2JGg4D+eqjrbXqm27gPL5Kx9sa5skjfviYsLedljlY0xljNxjo90mDM7uSVR7H0GODf6jHAHLZzTeHAjjMeCpbUxGQx8JPkDb6Kpst7hVInUWG430+i5c5HTjXrexca9lNtOo7O1zpa48NYdwWR7YspillF5Do1ItMTexga8fJXdhVxXpgkRlG/UEmwI8/zKtth9DEtdRYf6ozAWAEhoMQd8GDzWUvTSztnbIf2dJjs8tMXHwmASDwBBXS7Oxge0lrgbaWNtfmvP8AYznNbVa9xaBAM6gzAIvzP8K6KgH0HMcLA2tcGQSLcN8bks7Q2doYUVQHA/1GXB1lujgB0WHtX2Yo1X9oJFsxA3n+Qrz8US7MNCL37ngPArFG1azKrqf3pid4mxaRpbctr8Wc9szaGxmCmw0hBNRrI4AtzAHiSul2Xs1haxhqxVZbK50A72uAPL6ocDSbUh0QXEZ9bPAGR0HoB4+Ze0uDljKkEVA4gkWLYE25b1XflF/VDtBrW03NI1lrvvA7iNx43Xn2Pq5TlLpdOo3idV0+0sR21GBUBqta4VG6OIAs5vGI/glef4etmdJNpnz4KuOPXa1ybtB0AG8Kw+s8jMHRyOqp0q1rERoFIagab97oQqWLzJoYWtAkzm56rTZVaSIv8gsbD4eYNyToFt0MKWxIi3ER/wBrPJrjV1j3Rp6j9UlRLWDh4ud9Ek1E7cWHIg5Q5k2Ze48RYzoS5Q5ksyCXMmlRZks6CSU0qLOmL0EpKElRl6EvQTNqEXBgoXPJuTJ5qIuTZlAkLkgVFmRMKC5haZJ0lbmFss/A0gRK1aDLwq1aLHZ5hACp1KLm2PGd66LZeBa8wagaRucIlLaGzoBgDL97Ww1i65ubc7bcXfTkttsy87E/z1WZsvGljmu+6W8+YtystnaokGYgDXnCw8LS72WYvMcRvv0WO9ttaej+yeOis4Fwh2UFoNo7QNzeEGOi19q4VjXGo3UuNxqYi48JPAxdee4Wnke4h2VwAYI4xE+DiD/jzXbYfECoANQQ+Z+Id3f468lSajS9sYVGis6bsqhzHQO6YMB7eW+OalO0XtmnIcGxlgzItBB4ocVst9B+eczL66WsY8li4iqQWkjuEnMdCN2YRu5K0m1LXcYKDTBIgEk33Ej0H7rkfarBuY8PpvjNp+F4G7kRNuS3NhbQBApO7wOjuI+v88crbWEIqGnMtcJYZkQDMdRf0V51FPs+B2lUwraVV4JZUBa863Go67/NdXjK/b4drpmD8tPQx4BZdHCsfgajKmhII4tcGOJI4aeqk2I3I1tMuJBEHmYsRyP0VGjgvaitUwuMbWaO5rG42hzXdQY8VyTsSB0XrXtHgWlpNQAtcBO8jmvIttYB1GoRHcN2kaQuiYysPLVWqO0SdFubNa8gOI03m3kuVwbst4/VdLs7Elwygkn+eSw5MW3HXV4XFDLBEnhqpMK+mSQQZ3RqTwWZQDnWaA3lc+qs9gZAcCxwvYD5yuXKOqVfbXZFxffqkgGBcb5/PX5pKPBbycNmTFyjzIS5e48RJnSzqKU0oJs6bOocyUoJC9NmUcpSgkzJsyCUpQHmTFyFMSgLMp8OJ1HrCqgo6b76oOk2fhs3uOIPCWn01Wp9lqNFwY4kR81g7PqOPxLo8Djq9Mdyo7pNvVVq0X8Js8VBfEU+hnN4WWgdnVWtIFclvp4T9FHgG1qt3spt/F3R8rlDtCnkdq4jeT3RHjqqZ49LYXtm4zZ0g5tALddLeO9YGH2Xld3gc068BuXd4bGU3gFzcsARvM7iSfCB46XWdVotqvAYIZMyTdx3xwA08d27k8LHVMpVdmzKUEiZlwE8+fi087KfDNDIgy0EW/C8Tfz9FeZh2tYzLvc2OORp1A8B+bkpMHhQWMdGsEjjdmUecqvgt5NOuxjhkIBLmzG4FwgEdbeRXP4nAN7FzXt70npEka8wR58lq7SxoZSa+Zsxp5gXnpqoWYhjwc4kAOdzgnKJ8b/4laSaU24bCirhKoLZdTN76+e4rrsR2dbs3NFntDmneCbHobjxCpYdjXsbTPvNPe4+8Gn0JUQqVcPTptrjL3y1h3EHvQ4bt+irb7iZPttYD+rTNJw74zSOJZYkDgQ4dLqOpSc0DILNNju0FuX7q/gaOch+WHtJcHDRzHa/XyWhlBBEa68J48rKIm3TA+1NqsyPF9FxXtZschhIElpI+t11u2sC+m+ZGUkRy8RcKsx09yo6RoQTcCNRBv1W+FY5R5A/XSFfwhJdDRz0v4K/tvA0xVdlmJN418FXo0ouPGNVGcThW7s6tUbA1m1jB8luS54gNh2+fe8JXH0a7hvM7pFx9Fp7O2i8OJdedVy5Y/bpxydC3Dui+afP1ToaePdAgSOqSy3f416cGkmSXtPHJMSkmKBSmlMkiTpJkkQdJMkgeUySRQMpqLjwHkCoVLRdfd5Sg08CHT3X0webYPkB9V0eAqVm6ukcwD/tcCsvZtd7rRA5BoPmt2k5sXfB6D5hRamNTC16rx3GEbyWACT4Qmdhsxl8k8C4H0Ek+Szicx9+ev7rX2bhahF3hjddRfwF1HtPpDXoOj3SLEwbOPEneB1WUQ+mZc4wJgAwLxI5A3XSYqoRDKRk8Rq7/wBW8teayK+Ac90au38v0/miyywaY5pcLjGnJl+EBsmwEQDBN5mB4b7oNp47s+7Tee+HNZO8tBJdA0uxvmVQrMe0wyIJAHAZZFuAEnxKmoUqVSuH3yMOUA2gAXPKdVncWkyFtesSBlN2zYmBkflO7qfzBVhtMtZLwI7waRyJIJHM5rceoVTblZza7solrQARuyiP1POAEFPZ1Wo0NJs1oPyITXRtv+z1ft3ueIzGbREAuAMX4gefNb2PwtOu4U6kENDp5OEAOHC0rzrZFSrh6gc3/TkgjhfS2i7nFU3VMtei65bds6mIPofkssva89NTCYjs25QO8wkEDgTu47vLmhxL2h9jqAeXKFhYXajS4Am+/wCE9CNNRw3K5jMQ8tDm3jUCDbpvHS6hKwa2cADKSSbX+l5/l1zu1qMEAiLm4vb5QtDDVajrFoyuvI1MeMKjtCW5hLpOkqccuy4uO2nhT2hOZoHKUzcGTvE+XjO5aGKs7eXeBI/VRMsJLSPxC1+Y4q1u0SMx+zix4zPgmYJEjldQ0nd6Cd/8iFtyQIBBnQG48joVmVMK/MXPaImZbHooqY0KcQPfSSZTMWmOqSy01255JNKZeo8w6YpJIGSSTIFKaUkygFKeUCdSCTJpTIHlFTaSgUlJhJUWpkbuyqPET4rfoMaN0LnMCw21XT4AOgAhvj+yidp9LNFrOBPkPqtHC03ONmgc3O+qipYNxucscv0VumQLARzJ+n1U6Rtq4bAOiGxLrFxEE8mt1hNiMFA7Klqfff8ARvgpMBi2NEOJJOpmJG65vHKD0Wni8c2mzNlytjUjvHkBuHMqdI25faeFZh2TY1SMtNvDn6+ZXPYfB1aWHrPveernbyT4kDquvwWzzWzYyuYaJIn5Doj2lhg7ChobGZucjfHwg+Cyy9NMb24TGsFLBNqOGZ1SpSDidzHOaSfygro6pFN9Oofcf3HHhJJE/lWN7VOYKDKLdCWtMaAtAP0KstxQ7NlN8R3WnqIDHeIjyWFbQtoYYU62ZvuOjON3XqD9FZp03tIFN8N1G8D9lPVZmqBhjKLB3USQekAf5JY1vZWOkgsJG4kiLcPkVRZi7Qo1w852h1M3zNbz147oPS63dnHNTDXSIiL3E8J3fzcgoYjK2XEmQ4EGNTdrhu/UdEz2ufGUCIkgEWB013fK4VbVpGhWaGEEmJ3xYHqFRqvbkJqMDhfvNaJHMRw+qiqvcIymYkaki97ibEcCq+IxAI7vvRpJHrvCp9r/AEofYgXE07nUEWtznRBWwpa3vA5Xa8R4aEaK3hKECTbdBv8AzwKeu3KRwj+arSVGnOmmc3vX3HUeeqlYS18PiPOZ/mq6BuygWh7S2TpNxPA/qqWIwRd3g3K5tnNtbp14Kbdk6QMwpiwt0SUbagAjK7wcY8Eln4rbjiZSlJJek80pTJJIGSSSQMkkkiSTSnSRBkk6SB2hWqT43JklTJfFdoV3mwsuiwIgd4mUklOJWjSrk2bPmr1Ck4gOB8Tu6N/X0SSVlWphKApAVajhE2JlxJ5c+qmof/cqhskUwZJOschxuAkkn3pH+2hi6/2ioKLRlw7IAaN+XU+ir7fxZbSdBhzy2m3eG6CfCfMpJLPP0vj7cXt/DkvA0ZJPEnI208+8VA6DlMd6aebhAzg/8AUklhW0aNOpNR1BxOamXOB3Rz46eq1MbRz0xm1IMg3ylrS6R5JJLOrxm4Rjiezn3ZaCZuHXAdx3KwHZHNBgNII3m1pHneUklnWkTucATFjH1sZWdtNs0y4Xk9J1BPW1+MJJKcZ2b6UBVe5gubeY6GVco4ewl2ZrxN510PqkkrVEaGEqFjSARl3yP0/RQ1qzakwN3e4xxnenSSJrHrezlYuJYRlNxeEkkleKP//Z",
      alt: "Cat looks intently",
    },
  },
}
