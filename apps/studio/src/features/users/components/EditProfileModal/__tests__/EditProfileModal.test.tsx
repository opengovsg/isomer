import type { ReactNode } from "react"
import { render } from "@testing-library/react"
import { Window } from "happy-dom"
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import { EditProfileModal } from "../EditProfileModal"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  closeOnEsc?: boolean
  closeOnOverlayClick?: boolean
  children: ReactNode
}

let happyDomWindow: Window

const mockState = vi.hoisted(() => ({
  isOnboarded: false,
  modalProps: undefined as ModalProps | undefined,
}))

vi.mock("@chakra-ui/react", () => {
  const renderChildren = ({ children }: { children?: ReactNode }) => (
    <>{children}</>
  )

  return {
    Button: renderChildren,
    FormControl: renderChildren,
    Input: () => <input />,
    Modal: (props: ModalProps) => {
      mockState.modalProps = props
      return <div data-testid="profile-modal">{props.children}</div>
    },
    ModalBody: renderChildren,
    ModalCloseButton: () => <button type="button">Close</button>,
    ModalContent: renderChildren,
    ModalFooter: renderChildren,
    ModalHeader: renderChildren,
    ModalOverlay: renderChildren,
    VStack: renderChildren,
  }
})

vi.mock("@opengovsg/design-system-react", () => {
  const renderChildren = ({ children }: { children?: ReactNode }) => (
    <>{children}</>
  )

  return {
    FormErrorMessage: renderChildren,
    FormLabel: renderChildren,
    PhoneNumberInput: () => <input />,
    useToast: () => vi.fn(),
  }
})

vi.mock("jotai", () => ({
  useAtomValue: () => true,
  useSetAtom: () => vi.fn(),
  atom: vi.fn(),
}))

vi.mock("react-hook-form", () => ({
  Controller: ({
    render,
  }: {
    render: (args: {
      field: { onChange: () => void; value: string }
    }) => ReactNode
  }) => render({ field: { onChange: vi.fn(), value: "" } }),
}))

vi.mock("~/features/me/api", () => ({
  useMe: () => ({
    isOnboarded: mockState.isOnboarded,
    me: {
      name: "Test User",
      phone: "91234567",
    },
  }),
}))

vi.mock("~/lib/form", () => ({
  useZodForm: () => ({
    control: {},
    formState: { errors: {}, isDirty: false },
    handleSubmit: (callback: () => void) => callback,
    register: vi.fn(),
    reset: vi.fn(),
  }),
}))

vi.mock("~/schemas/user", () => ({
  updateUserDetailsInputSchema: {},
}))

vi.mock("~/utils/trpc", () => ({
  trpc: {
    useUtils: () => ({
      me: {
        get: {
          invalidate: vi.fn(),
        },
      },
    }),
    user: {
      updateDetails: {
        useMutation: () => ({
          isPending: false,
          mutate: vi.fn(),
        }),
      },
    },
  },
}))

beforeAll(() => {
  happyDomWindow = new Window()
  const global = globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT: boolean
  }
  global.IS_REACT_ACT_ENVIRONMENT = true
  vi.stubGlobal("window", happyDomWindow)
  vi.stubGlobal("document", happyDomWindow.document)
})

afterAll(() => {
  happyDomWindow.close()
})

beforeEach(() => {
  mockState.isOnboarded = false
  mockState.modalProps = undefined
})

describe("EditProfileModal", () => {
  it("prevents non-onboarded users from dismissing the required profile modal", () => {
    // Act
    render(<EditProfileModal />)

    // Assert
    expect(mockState.modalProps?.closeOnEsc).toBe(false)
    expect(mockState.modalProps?.closeOnOverlayClick).toBe(false)
  })

  it("keeps normal dismissal behaviour for onboarded users editing their profile", () => {
    // Arrange
    mockState.isOnboarded = true

    // Act
    render(<EditProfileModal />)

    // Assert
    expect(mockState.modalProps?.closeOnEsc).toBe(true)
    expect(mockState.modalProps?.closeOnOverlayClick).toBe(true)
  })
})
