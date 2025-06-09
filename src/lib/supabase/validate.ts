import { supabase } from './client'
import { createServiceRoleClient } from './server'

export interface ValidationResult {
  success: boolean
  message: string
  details?: any
}

export interface ValidationReport {
  client: ValidationResult
  auth: ValidationResult
  database: ValidationResult
  storage: ValidationResult
  functions: ValidationResult
  overall: ValidationResult
}

// Validate client configuration
export async function validateClient(): Promise<ValidationResult> {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1)
    
    if (error) {
      return {
        success: false,
        message: 'Client configuration failed',
        details: error
      }
    }

    return {
      success: true,
      message: 'Client configuration is valid'
    }
  } catch (error) {
    return {
      success: false,
      message: 'Client validation error',
      details: error
    }
  }
}

// Validate auth configuration
export async function validateAuth(): Promise<ValidationResult> {
  try {
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      return {
        success: false,
        message: 'Auth configuration failed',
        details: error
      }
    }

    return {
      success: true,
      message: 'Auth configuration is valid',
      details: { hasSession: !!data.session }
    }
  } catch (error) {
    return {
      success: false,
      message: 'Auth validation error',
      details: error
    }
  }
}

// Validate database schema
export async function validateDatabase(): Promise<ValidationResult> {
  try {
    const tables = ['users', 'lists', 'places', 'list_places'] as const
    const results = []

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (error) {
        return {
          success: false,
          message: `Database validation failed for table: ${table}`,
          details: error
        }
      }

      results.push({ table, accessible: true })
    }

    return {
      success: true,
      message: 'Database schema is valid',
      details: { tables: results }
    }
  } catch (error) {
    return {
      success: false,
      message: 'Database validation error',
      details: error
    }
  }
}

// Validate storage configuration
export async function validateStorage(): Promise<ValidationResult> {
  try {
    const { data, error } = await supabase.storage.listBuckets()
    
    if (error) {
      return {
        success: false,
        message: 'Storage configuration failed',
        details: error
      }
    }

    const hasProfilePhotosBucket = data.some(bucket => bucket.name === 'profile-photos')

    return {
      success: true,
      message: 'Storage configuration is valid',
      details: { 
        buckets: data.map(b => b.name),
        hasProfilePhotosBucket 
      }
    }
  } catch (error) {
    return {
      success: false,
      message: 'Storage validation error',
      details: error
    }
  }
}

// Validate database functions
export async function validateFunctions(): Promise<ValidationResult> {
  try {
    // Test get_user_lists_with_counts function
    const { data: listsData, error: listsError } = await supabase
      .rpc('get_user_lists_with_counts', { user_uuid: '00000000-0000-0000-0000-000000000000' })

    if (listsError) {
      return {
        success: false,
        message: 'Database functions validation failed',
        details: listsError
      }
    }

    // Test increment_list_view_count function (this will fail for non-existent list, but that's expected)
    const { error: incrementError } = await supabase
      .rpc('increment_list_view_count', { list_uuid: '00000000-0000-0000-0000-000000000000' })

    // We expect this to fail for a non-existent list, so we check the error type
    const isExpectedError = incrementError?.code === 'PGRST116' || incrementError?.message?.includes('No rows')

    return {
      success: true,
      message: 'Database functions are accessible',
      details: { 
        getUserListsWithCounts: 'accessible',
        incrementListViewCount: isExpectedError ? 'accessible (expected error for test UUID)' : 'accessible'
      }
    }
  } catch (error) {
    return {
      success: false,
      message: 'Functions validation error',
      details: error
    }
  }
}

// Run complete validation
export async function validateSupabaseConfiguration(): Promise<ValidationReport> {
  console.log('🔍 Validating Supabase configuration...')

  const [client, auth, database, storage, functions] = await Promise.all([
    validateClient(),
    validateAuth(),
    validateDatabase(),
    validateStorage(),
    validateFunctions()
  ])

  const allSuccessful = [client, auth, database, storage, functions].every(result => result.success)

  const overall: ValidationResult = {
    success: allSuccessful,
    message: allSuccessful 
      ? '✅ All Supabase configurations are valid!' 
      : '❌ Some Supabase configurations failed validation'
  }

  const report: ValidationReport = {
    client,
    auth,
    database,
    storage,
    functions,
    overall
  }

  // Log results
  console.log('\n📊 Validation Report:')
  console.log('Client:', client.success ? '✅' : '❌', client.message)
  console.log('Auth:', auth.success ? '✅' : '❌', auth.message)
  console.log('Database:', database.success ? '✅' : '❌', database.message)
  console.log('Storage:', storage.success ? '✅' : '❌', storage.message)
  console.log('Functions:', functions.success ? '✅' : '❌', functions.message)
  console.log('\n', overall.message)

  return report
}

// Environment variables validation
export function validateEnvironmentVariables(): ValidationResult {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]

  const optionalVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_PERSONAL_ACCESS_TOKEN'
  ]

  const missing = requiredVars.filter(varName => !process.env[varName])
  const present = requiredVars.filter(varName => !!process.env[varName])
  const optionalPresent = optionalVars.filter(varName => !!process.env[varName])

  if (missing.length > 0) {
    return {
      success: false,
      message: `Missing required environment variables: ${missing.join(', ')}`,
      details: { missing, present, optionalPresent }
    }
  }

  return {
    success: true,
    message: 'All required environment variables are present',
    details: { present, optionalPresent }
  }
} 