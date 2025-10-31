"use client"

import * as React from "react"

import Link from "next/link"


import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs"

export function SiteHeader() {
  const breadcrumbs = useBreadcrumbs()

  return (
    <header className="flex sticky top-0 z-50 w-full items-center border-b bg-surface">
      <div className="flex h-[--header-height] w-full items-center gap-2 px-4">
        <SidebarTrigger className="h-8 w-8" />
        <Separator orientation="vertical" className="mr-2 h-full" />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={item.href}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {item.isCurrentPage ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={item.href}>{item.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        
      </div>
    </header>
  )
}
