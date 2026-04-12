import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/leave/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/leave/"!</div>
}
