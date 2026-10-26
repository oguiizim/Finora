import { createFileRoute } from '@tanstack/react-router'
import { AuthPage } from '#/components/auth/auth-page.tsx'
export const Route = createFileRoute('/login')({ component: () => <AuthPage mode="login" /> })
