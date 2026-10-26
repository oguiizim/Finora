import { createFileRoute } from '@tanstack/react-router'
import { AuthPage } from '#/components/auth/auth-page.tsx'
export const Route = createFileRoute('/cadastro')({ component: () => <AuthPage mode="register" /> })
