'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useAuth } from '../../lib/auth-context'
import { useStore } from '../../lib/store'
import { 
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  })
  const { user: authUser } = useAuth()
  const { user, setUser } = useStore()
  
  // Use authUser from AuthContext as the source of truth
  const currentUser = authUser || user

  const handleEdit = () => {
    if (currentUser) {
      setFormData({
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone || '',
        address: currentUser.address || '',
      })
    }
    setIsEditing(true)
  }

  const handleSave = () => {
    if (user) {
      const updatedUser = {
        ...user,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      }
      setUser(updatedUser)
      toast.success('Profile updated successfully!')
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
          <p className="text-gray-600 mb-8">You need to be signed in to view your profile.</p>
          <a href="/login" className="btn btn-primary">
            Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">Manage your account information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="card p-6 text-center">
              <div className="mb-6">
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="h-12 w-12 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{currentUser.name}</h2>
                <p className="text-gray-600 capitalize">{currentUser.role}</p>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-center space-x-2">
                  <EnvelopeIcon className="h-4 w-4" />
                  <span>{currentUser.email}</span>
                </div>
                {currentUser.phone && (
                  <div className="flex items-center justify-center space-x-2">
                    <PhoneIcon className="h-4 w-4" />
                    <span>{currentUser.phone}</span>
                  </div>
                )}
                {currentUser.address && (
                  <div className="flex items-center justify-center space-x-2">
                    <MapPinIcon className="h-4 w-4" />
                    <span className="text-center">{currentUser.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Account Information</h3>
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="btn btn-outline flex items-center space-x-2"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      className="btn btn-primary flex items-center space-x-2"
                    >
                      <CheckIcon className="h-4 w-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="btn btn-outline flex items-center space-x-2"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="input"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{currentUser.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="input"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{currentUser.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{currentUser.phone || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="Enter your address"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{currentUser.address || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Type
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      currentUser.role === 'buyer' ? 'bg-blue-100 text-blue-800' :
                      currentUser.role === 'seller' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
