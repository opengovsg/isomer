import { useDisclosure } from '@chakra-ui/react'
import { Button } from '@opengovsg/design-system-react'
import PageCreateModal from '~/components/features/editing-experience/PageCreateModal'

export default function Dashboard() {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <div>
      {/* TODO: Dashboard layout */}
      <h1>DASHBOARD</h1>

      <Button onClick={onOpen}>Create new page</Button>
      <PageCreateModal isOpen={isOpen} onClose={onClose} />
    </div>
  )
}
