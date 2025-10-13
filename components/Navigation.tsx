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
                <button className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200">
                  <span className="text-xl">👤</span>
                  <span className="hidden sm:block font-medium">{user?.name}</span>
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Profile
                  </Link>
                  <Link href="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    My Orders
                  </Link>
                  <button
                    onClick={signOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
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