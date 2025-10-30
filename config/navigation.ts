import {
  Home,
  Key,
  List,
  FileText,
  HelpCircle,
  Github,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  description?: string
  isActive?: boolean
}

export const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    description: "Página inicial do sistema",
  },
  {
    title: "Credenciais",
    url: "/pje/credentials",
    icon: Key,
    description: "Gerenciar credenciais de acesso",
  },
  {
    title: "Raspagens",
    url: "/pje/scrapes",
    icon: List,
    description: "Visualizar e gerenciar raspagens",
  },
  {
    title: "Processos",
    url: "/pje/processos",
    icon: FileText,
    description: "Consultar processos",
  },
]

export const secondaryNavItems: NavItem[] = [
  {
    title: "Ajuda",
    url: "/help",
    icon: HelpCircle,
  },
  {
    title: "GitHub",
    url: "https://github.com/SinesysTech/JusBro",
    icon: Github,
  },
]
