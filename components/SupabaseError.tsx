'use client'

import { useState, useEffect } from 'react'

interface SupabaseErrorProps {
  children: React.ReactNode
}

export default function SupabaseErrorBoundary({ children }: SupabaseErrorProps) {
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    try {
      // Check if environment variables are present
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey || 
          supabaseUrl.includes('your_supabase') || 
          supabaseAnonKey.includes('your_supabase')) {
        setHasError(true)
        setErrorMessage('Supabase is not configured. Please check your environment variables.')
      }
    } catch (error) {
      console.error('Error checking Supabase configuration:', error)
      setHasError(true)
      setErrorMessage('Error loading Supabase configuration.')
    }
  }, [])

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Configuration Required
            </h3>
            <p className="text-red-700 mb-4">
              {errorMessage}
            </p>
            <div className="text-left bg-red-100 p-4 rounded-md mb-4">
              <p className="text-sm text-red-800 font-medium mb-2">To fix this:</p>
              <ol className="text-sm text-red-700 space-y-1">
                <li>1. Create a Supabase project at <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a></li>
                <li>2. Get your project URL and API keys</li>
                <li>3. Update your .env.local file with:</li>
              </ol>
              <div className="mt-2 p-2 bg-red-200 rounded text-xs font-mono">
                <div>NEXT_PUBLIC_SUPABASE_URL=your_project_url</div>
                <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key</div>
                <div>SUPABASE_SERVICE_ROLE_KEY=your_service_key</div>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
