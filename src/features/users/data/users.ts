import usersData from './users.json'

type UserStatus = 'active' | 'inactive' | 'invited' | 'suspended'
type UserRole = 'superadmin' | 'admin' | 'manager' | 'cashier'

export const users = usersData.map((user) => ({
  ...user,
  status: user.status as UserStatus,
  role: user.role as UserRole,
  createdAt: new Date(user.createdAt),
  updatedAt: new Date(user.updatedAt),
}))
