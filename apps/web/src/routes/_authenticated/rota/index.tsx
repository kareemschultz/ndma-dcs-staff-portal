import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/rota/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/rota/"!</div>
}
