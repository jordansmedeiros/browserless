"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  Gavel,
  Key,
  FileText,
  List,
  Home,
  Settings2,
  HelpCircle,
  Github,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Usuário",
    email: "usuario@example.com",
    avatar: "/avatars/user.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: false,
    },
    {
      title: "PJE Automação",
      url: "/pje",
      icon: Gavel,
      isActive: false,
      items: [
        {
          title: "Credenciais",
          url: "/pje/credentials",
        },
        {
          title: "Processos",
          url: "/pje/processos",
        },
        {
          title: "Raspagens",
          url: "/pje/scrapes",
        },
      ],
    },
    {
      title: "Configurações",
      url: "/settings",
      icon: Settings2,
      isActive: false,
    },
  ],
  navSecondary: [
    {
      title: "Ajuda",
      url: "/help",
      icon: HelpCircle,
    },
    {
      title: "GitHub",
      url: "https://github.com/browserless/browserless",
      icon: Github,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  // Update active state based on current pathname
  const navMainWithActive = data.navMain.map((item) => ({
    ...item,
    isActive: pathname === item.url || pathname.startsWith(item.url + '/'),
  }))

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Gavel className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">JusBrowserless</span>
                  <span className="truncate text-xs">PJE Automation</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainWithActive} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
