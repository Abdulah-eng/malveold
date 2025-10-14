'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '../lib/auth-context'
import { useStore } from '../lib/store'
import { formatPrice } from '../lib/utils'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, loading, signOut } = useAuth()
  const { cart, loadCart, loadProducts } = useStore()
  const isAuthenticated = !!user

  useEffect(() => {
    if (user) {
      loadCart(user.id)
      loadProducts()
    }
  }, [user, loadCart, loadProducts])
  
  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  const cartItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Browse', href: '/products' },
    ...(user?.role === 'seller' ? [{ name: 'My Store', href: '/seller' }] : []),
    ...(user?.role === 'driver' ? [{ name: 'Deliveries', href: '/driver' }] : []),
  ]

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
              <div className="relative flex-shrink-0">
                <Image
                  src="/logo.jpg"
                  alt="DeliverEase"
                  width={40}
                  height={40}
                  className="rounded-lg shadow-sm border border-primary-200 object-cover"
                />
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-primary-600">DeliverEase</span>
                <span className="text-xs text-gray-500 -mt-0.5">Multi-Purpose Platform</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 font-medium"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link href="/cart" className="relative p-3 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all duration-200">
              <span className="text-xl">🛒</span>
              {cartItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg animate-pulse">
                  {cartItems}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 border border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold">
                    {user?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-semibold">{user?.name}</div>
                    <div className="text-xs text-gray-500">{user?.email}</div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-100">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    <p className="text-xs text-primary-600 font-medium mt-1 capitalize">{user?.role}</p>
                  </div>
                  
                  <Link href="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    My Profile
                  </Link>
                  
                  {user?.role === 'buyer' && (
                    <Link href="/orders" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      My Orders
                    </Link>
                  )}
                  {user?.role === 'seller' && (
                    <Link href="/seller" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Seller Dashboard
                    </Link>
                  )}
                  {user?.role === 'driver' && (
                    <Link href="/driver" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                      </svg>
                      Driver Dashboard
                    </Link>
                  )}
                  
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button
                      onClick={signOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  href="/login" 
                  className="px-6 py-2.5 text-sm font-semibold text-primary-600 bg-white border-2 border-primary-200 rounded-full hover:bg-primary-50 hover:border-primary-300 transition-all duration-200 shadow-sm"
                >
                  Sign In
                </Link>
                <Link 
                  href="/register" 
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-full hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-primary-600"
            >
              {isOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 rounded-lg mt-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-primary-600 hover:bg-primary-50 block px-4 py-3 rounded-lg font-medium transition-all duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {!isAuthenticated && (
                <div className="pt-4 space-y-3">
                  <Link
                    href="/login"
                    className="block w-full px-6 py-3 text-center text-sm font-semibold text-primary-600 bg-white border-2 border-primary-200 rounded-full hover:bg-primary-50 hover:border-primary-300 transition-all duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="block w-full px-6 py-3 text-center text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-full hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}