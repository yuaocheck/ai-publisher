'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database.types'

type UserRole = 'owner' | 'admin' | 'editor' | 'viewer'

interface OrganizationMembership {
  org_id: string
  role: UserRole
  organization: {
    id: string
    name: string
    slug: string
  }
}

interface PermissionConfig {
  // Content permissions
  canCreatePosts: boolean
  canEditPosts: boolean
  canDeletePosts: boolean
  canPublishPosts: boolean
  canSchedulePosts: boolean
  
  // Account permissions
  canConnectAccounts: boolean
  canDisconnectAccounts: boolean
  canViewAccounts: boolean
  
  // Organization permissions
  canInviteMembers: boolean
  canRemoveMembers: boolean
  canChangeRoles: boolean
  canEditOrganization: boolean
  canDeleteOrganization: boolean
  
  // API permissions
  canCreateApiKeys: boolean
  canRevokeApiKeys: boolean
  canViewApiKeys: boolean
  
  // Analytics permissions
  canViewAnalytics: boolean
  canExportData: boolean
  
  // Settings permissions
  canEditSettings: boolean
  canViewBilling: boolean
}

const getPermissionsForRole = (role: UserRole): PermissionConfig => {
  const basePermissions: PermissionConfig = {
    canCreatePosts: false,
    canEditPosts: false,
    canDeletePosts: false,
    canPublishPosts: false,
    canSchedulePosts: false,
    canConnectAccounts: false,
    canDisconnectAccounts: false,
    canViewAccounts: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canChangeRoles: false,
    canEditOrganization: false,
    canDeleteOrganization: false,
    canCreateApiKeys: false,
    canRevokeApiKeys: false,
    canViewApiKeys: false,
    canViewAnalytics: false,
    canExportData: false,
    canEditSettings: false,
    canViewBilling: false,
  }

  switch (role) {
    case 'owner':
      return {
        ...basePermissions,
        canCreatePosts: true,
        canEditPosts: true,
        canDeletePosts: true,
        canPublishPosts: true,
        canSchedulePosts: true,
        canConnectAccounts: true,
        canDisconnectAccounts: true,
        canViewAccounts: true,
        canInviteMembers: true,
        canRemoveMembers: true,
        canChangeRoles: true,
        canEditOrganization: true,
        canDeleteOrganization: true,
        canCreateApiKeys: true,
        canRevokeApiKeys: true,
        canViewApiKeys: true,
        canViewAnalytics: true,
        canExportData: true,
        canEditSettings: true,
        canViewBilling: true,
      }

    case 'admin':
      return {
        ...basePermissions,
        canCreatePosts: true,
        canEditPosts: true,
        canDeletePosts: true,
        canPublishPosts: true,
        canSchedulePosts: true,
        canConnectAccounts: true,
        canDisconnectAccounts: true,
        canViewAccounts: true,
        canInviteMembers: true,
        canRemoveMembers: true,
        canChangeRoles: false, // Only owners can change roles
        canEditOrganization: true,
        canDeleteOrganization: false, // Only owners can delete
        canCreateApiKeys: true,
        canRevokeApiKeys: true,
        canViewApiKeys: true,
        canViewAnalytics: true,
        canExportData: true,
        canEditSettings: true,
        canViewBilling: false, // Only owners can view billing
      }

    case 'editor':
      return {
        ...basePermissions,
        canCreatePosts: true,
        canEditPosts: true,
        canDeletePosts: false, // Can only delete own posts
        canPublishPosts: true,
        canSchedulePosts: true,
        canConnectAccounts: true,
        canDisconnectAccounts: false,
        canViewAccounts: true,
        canInviteMembers: false,
        canRemoveMembers: false,
        canChangeRoles: false,
        canEditOrganization: false,
        canDeleteOrganization: false,
        canCreateApiKeys: false,
        canRevokeApiKeys: false,
        canViewApiKeys: false,
        canViewAnalytics: true,
        canExportData: false,
        canEditSettings: false,
        canViewBilling: false,
      }

    case 'viewer':
      return {
        ...basePermissions,
        canCreatePosts: false,
        canEditPosts: false,
        canDeletePosts: false,
        canPublishPosts: false,
        canSchedulePosts: false,
        canConnectAccounts: false,
        canDisconnectAccounts: false,
        canViewAccounts: true,
        canInviteMembers: false,
        canRemoveMembers: false,
        canChangeRoles: false,
        canEditOrganization: false,
        canDeleteOrganization: false,
        canCreateApiKeys: false,
        canRevokeApiKeys: false,
        canViewApiKeys: false,
        canViewAnalytics: true,
        canExportData: false,
        canEditSettings: false,
        canViewBilling: false,
      }

    default:
      return basePermissions
  }
}

export function usePermissions(organizationId?: string) {
  const { user } = useAuth()
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([])
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null)
  const [permissions, setPermissions] = useState<PermissionConfig>(getPermissionsForRole('viewer'))
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    if (user) {
      loadMemberships()
    } else {
      setMemberships([])
      setCurrentRole(null)
      setPermissions(getPermissionsForRole('viewer'))
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (organizationId && memberships.length > 0) {
      const membership = memberships.find(m => m.org_id === organizationId)
      const role = membership?.role || 'viewer'
      setCurrentRole(role)
      setPermissions(getPermissionsForRole(role))
    } else if (memberships.length > 0) {
      // Use the first organization's role as default
      const role = memberships[0].role
      setCurrentRole(role)
      setPermissions(getPermissionsForRole(role))
    }
  }, [organizationId, memberships])

  const loadMemberships = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          org_id,
          role,
          organizations:org_id (
            id,
            name,
            slug
          )
        `)
        .eq('user_id', user.id)

      if (error) {
        console.error('Failed to load memberships:', error)
        return
      }

      const formattedMemberships: OrganizationMembership[] = data.map(item => ({
        org_id: item.org_id,
        role: item.role as UserRole,
        organization: {
          id: item.organizations.id,
          name: item.organizations.name,
          slug: item.organizations.slug,
        }
      }))

      setMemberships(formattedMemberships)
    } catch (error) {
      console.error('Error loading memberships:', error)
    } finally {
      setLoading(false)
    }
  }

  const hasPermission = (permission: keyof PermissionConfig): boolean => {
    return permissions[permission]
  }

  const canEditPost = (postCreatorId: string): boolean => {
    if (!user) return false
    
    // Users can always edit their own posts (if they have basic edit permission)
    if (postCreatorId === user.id && permissions.canEditPosts) {
      return true
    }
    
    // Admins and owners can edit any post
    return currentRole === 'admin' || currentRole === 'owner'
  }

  const canDeletePost = (postCreatorId: string): boolean => {
    if (!user) return false
    
    // Users can delete their own posts if they have delete permission
    if (postCreatorId === user.id && permissions.canDeletePosts) {
      return true
    }
    
    // Admins and owners can delete any post
    return currentRole === 'admin' || currentRole === 'owner'
  }

  const getRoleDisplayName = (role: UserRole): string => {
    const roleNames = {
      owner: '所有者',
      admin: '管理员',
      editor: '编辑者',
      viewer: '查看者',
    }
    return roleNames[role] || role
  }

  return {
    memberships,
    currentRole,
    permissions,
    loading,
    hasPermission,
    canEditPost,
    canDeletePost,
    getRoleDisplayName,
    refetch: loadMemberships,
  }
}
