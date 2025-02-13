import type { Meta, StoryObj } from "@storybook/react"

import type { MapProps } from "~/interfaces"
import { Map } from "./Map"

const meta: Meta<MapProps> = {
  title: "Next/Components/Map",
  component: Map,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof Map>

export const GoogleMapsLocation: Story = {
  args: {
    title: "Office of Open Government Products, Singapore",
    url: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d997.1986718091739!2d103.84951406959217!3d1.2979038406790597!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31da19ec2599519d%3A0x809fd655663da6d0!2sLazada%20One!5e0!3m2!1sen!2ssg!4v1731681752852!5m2!1sen!2ssg",
  },
}

export const GoogleMapsRegion: Story = {
  args: {
    title: "Singapore region",
    url: "https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d127639.0647119137!2d103.79481771806647!3d1.343949056391766!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2ssg!4v1731681854346!5m2!1sen!2ssg",
  },
}

export const OneMapLocation: Story = {
  name: "OneMap location",
  args: {
    title: "Singapore region",
    url: "https://www.onemap.gov.sg/minimap/minimap.html?mapStyle=Default&zoomLevel=15&latLng=1.29793747849037,103.850182257356&ewt=JTNDcCUzRSUzQ3N0cm9uZyUzRU9wZW4lMjBHb3Zlcm5tZW50JTIwUHJvZHVjdHMlMjBvZmZpY2UlM0MlMkZzdHJvbmclM0UlM0MlMkZwJTNF&popupWidth=200&showPopup=true",
  },
}
