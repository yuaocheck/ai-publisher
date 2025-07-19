'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronDownIcon, CheckIcon, PlusIcon } from '@heroicons/react/24/outline'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuth } from '@/components/providers'
import Link from 'next/link'

interface Organization {
  id: string
  name: string
  slug: string
  role: string
}

interface OrganizationSwitcherProps {
  currentOrgId?: string
  onOrgChange?: (orgId: string) => void
}

export function OrganizationSwitcher({ currentOrgId, onOrgChange }: OrganizationSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const { memberships, getRoleDisplayName } = usePermissions()
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (memberships.length > 0) {
      const current = currentOrgId 
        ? memberships.find(m => m.org_id === currentOrgId)
        : memberships[0]
      
      if (current) {
        setSelectedOrg({
          id: current.org_id,
          name: current.organization.name,
          slug: current.organization.slug,
          role: current.role,
        })
      }
    }
  }, [memberships, currentOrgId])

  const handleOrgSelect = (org: Organization) => {
    setSelectedOrg(org)
    setIsOpen(false)
    
    if (onOrgChange) {
      onOrgChange(org.id)
    }
    
    // Update URL if we're in a dashboard route
    if (pathname.startsWith('/dashboard')) {
      const searchParams = new URLSearchParams(window.location.search)
      searchParams.set('org', org.id)
      router.push(`${pathname}?${searchParams.toString()}`)
    }
  }

  if (!user || memberships.length === 0) {
    return null
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center flex-1 min-w-0">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {selectedOrg?.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {selectedOrg?.name}
            </p>
            <p className="text-xs text-gray-500">
              {selectedOrg && getRoleDisplayName(selectedOrg.role as any)}
            </p>
          </div>
        </div>
        <ChevronDownIcon className="flex-shrink-0 ml-2 h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            <div className="py-1">
              {memberships.map((membership) => {
                const org = {
                  id: membership.org_id,
                  name: membership.organization.name,
                  slug: membership.organization.slug,
                  role: membership.role,
                }
                
                const isSelected = selectedOrg?.id === org.id
                
                return (
                  <button
                    key={org.id}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                    onClick={() => handleOrgSelect(org)}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">
                            {org.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {org.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getRoleDisplayName(org.role as any)}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckIcon className="flex-shrink-0 ml-2 h-4 w-4 text-blue-600" />
                    )}
                  </button>
                )
              })}
              
              {/* Divider */}
              <div className="border-t border-gray-200 my-1" />
              
              {/* Create new organization */}
              <Link
                href="/onboarding"
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <PlusIcon className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      创建新组织
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
