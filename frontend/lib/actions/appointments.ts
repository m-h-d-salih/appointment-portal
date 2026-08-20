'use server'

import { createClient } from '@/lib/supabase/server'

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, user }
}

// Search client by phone number (for returning clients)
export async function searchClientByPhone(phone: string) {
   const { supabase } = await getAuthenticatedUser()

  const { data: client, error } = await supabase
    .from('clients')
    .select(`
      *,
      appointments (
        id,
        status,
        scheduled_date,
        created_at
      )
    `)
    .eq('phone', phone)
    .single()

  if (error || !client) return { client: null, appointments: [] }

  return {
    client,
    appointments: client.appointments || [],
  }
}

// Create a new appointment (handles both new and returning clients)
export async function createAppointment(values: {
  name: string
  age: string
  relative: string
  address: string
  countryCode: string
  phone: string
  clientType: 'Student' | 'Client'
  scheduledDate?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check if client already exists by phone
  const { data: existingClient } = await supabase
    .from('clients')
    .select('id')
    .eq('phone', values.phone)
    .single()

  let clientId: string

  if (existingClient) {
    // Update existing client info
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        name: values.name,
        age: values.age,
        relative: values.relative,
        address: values.address,
        country_code: values.countryCode,
        client_type: values.clientType,
      })
      .eq('id', existingClient.id)

    if (updateError) return { error: updateError.message }
    clientId = existingClient.id
  } else {
    // Create new client
    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert({
        name: values.name,
        age: values.age,
        relative: values.relative,
        address: values.address,
        country_code: values.countryCode,
        phone: values.phone,
        client_type: values.clientType,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (clientError) return { error: clientError.message }
    clientId = newClient.id
  }

  // Create the appointment
  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      client_id: clientId,
      status: 'Pending',
      scheduled_date: values.scheduledDate || null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (appointmentError) return { error: appointmentError.message }

  // Create empty application form for this appointment
  await supabase
    .from('application_forms')
    .insert({ appointment_id: appointment.id })

  return { success: true, appointmentId: appointment.id, clientId }
}

// Fetch all appointments with client info
export async function getAppointments(params?: {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}) {
   const { supabase } = await getAuthenticatedUser()
  const {
    page = 1,
    pageSize = 10,
    search,
    status,
    dateFrom,
    dateTo,
  } = params || {}
 
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
 
  let query = supabase
    .from('appointments')
    .select(
      `
      id, status, scheduled_date, notes, created_at,
      client:clients!inner (
        id, name, age, relative, address, country_code, phone, client_type
      )
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to)
 
  // Filter by status
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }
 
  // Filter by date range
  if (dateFrom) {
    query = query.gte('created_at', `${dateFrom}T00:00:00`)
  }
  if (dateTo) {
    query = query.lte('created_at', `${dateTo}T23:59:59`)
  }
 
  // Search by client name or phone
if (search && search.trim()) {
  query = query.or(`name.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%`, { referencedTable: 'clients' })
}
 
  const { data, count, error } = await query
 
  if (error) return { error: error.message, appointments: [], total: 0 }
 
  const appointments = (data || []).map((apt) => {
    const client = apt.client as unknown as {
      id: string
      name: string
      age: string
      relative: string
      address: string
      country_code: string
      phone: string
      client_type: string
    }
 
    return {
      id: apt.id,
      name: client.name || '',
      age: client.age || '',
      relative: client.relative || '',
      address: client.address || '',
      countryCode: client.country_code || '+91',
      phone: client.phone || '',
      clientType: (client.client_type || 'Client') as 'Student' | 'Client',
      status: apt.status as 'Pending' | 'Accepted' | 'Rejected',
      createdAt: new Date(apt.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      clientId: client.id || '',
      scheduledDate: apt.scheduled_date,
    }
  })
 
  return { appointments, total: count || 0, error: null }
}

// Update appointment status
export async function updateAppointmentStatus(
  appointmentId: string,
  status: 'Accepted' | 'Rejected'
) {
   const { supabase } = await getAuthenticatedUser()

  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId)

  if (error) return { error: error.message }
  return { success: true }
}

// Delete appointment
export async function deleteAppointment(appointmentId: string) {
   const { supabase } = await getAuthenticatedUser()

  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentId)

  if (error) return { error: error.message }
  return { success: true }
}

// Fetch clients who have at least one accepted appointment
export async function getApprovedClients(params?: {
  page?: number
  pageSize?: number
  search?: string
  clientType?: string
  dateFrom?: string
  dateTo?: string
}) {
   const { supabase } = await getAuthenticatedUser()
  const {
    page = 1,
    pageSize = 10,
    search,
    clientType,
    dateFrom,
    dateTo,
  } = params || {}

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // First, get appointment IDs matching the date filter
  let appointmentQuery = supabase
    .from('appointments')
    .select('client_id')
    .eq('status', 'Accepted')

  if (dateFrom) {
    appointmentQuery = appointmentQuery.gte('scheduled_date', dateFrom)
  }
  if (dateTo) {
    appointmentQuery = appointmentQuery.lte('scheduled_date', dateTo)
  }

  const { data: matchingAppointments } = await appointmentQuery

  // If date filter is active but no matches, return empty
  if ((dateFrom || dateTo) && (!matchingAppointments || matchingAppointments.length === 0)) {
    return { clients: [], total: 0, error: null }
  }

  const matchedClientIds = matchingAppointments
    ? [...new Set(matchingAppointments.map((a) => a.client_id))]
    : null

  // Now query clients
  let query = supabase
    .from('clients')
    .select(
      `
      id, name, age, phone, country_code, client_type, address, created_at,
      appointments!inner (
        id, status, scheduled_date, created_at
      )
    `,
      { count: 'exact' },
    )
    .eq('appointments.status', 'Accepted')
    .order('created_at', { ascending: false })
    .range(from, to)

  // Filter by matched client IDs from date query
  if (matchedClientIds) {
    query = query.in('id', matchedClientIds)
  }

  if (clientType && clientType !== 'all') {
    query = query.eq('client_type', clientType)
  }

  if (search && search.trim()) {
    query = query.or(`name.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%`)
  }

  const { data, count, error } = await query

  if (error) return { error: error.message, clients: [], total: 0 }

  const seen = new Set<string>()
  const clients = (data || [])
    .filter((c) => {
      if (seen.has(c.id)) return false
      seen.add(c.id)
      return true
    })
    .map((c) => {
      const appts = c.appointments as unknown as {
        id: string
        status: string
        scheduled_date: string | null
        created_at: string
      }[]

      const latestDate = appts
        .map((a) => a.scheduled_date)
        .filter(Boolean)
        .sort()
        .pop() || ''

      return {
        id: c.id,
        name: c.name,
        age: c.age || '',
        phone: c.phone,
        countryCode: c.country_code || '+91',
        clientType: c.client_type as string,
        address: c.address || '',
        createdAt: new Date(c.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        totalAppointments: appts.length,
        scheduledDate: latestDate,
      }
    })

  return { clients, total: count || 0, error: null }
}
 
// ─── Dashboard: latest 5 appointments (no pagination needed) ───
export async function getLatestAppointments(limit: number = 5) {
   const { supabase } = await getAuthenticatedUser()
 
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id, status, scheduled_date, created_at,
      client:clients!inner (
        id, name, client_type
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)
 
  if (error) return { appointments: [], error: error.message }
 
  const appointments = (data || []).map((apt) => {
    const client = apt.client as unknown as {
      id: string
      name: string
      client_type: string
    }
 
    return {
      id: apt.id,
      patient: client.name,
      type: client.client_type,
      date: new Date(apt.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      status: apt.status,
      clientId: client.id,
    }
  })
 
  return { appointments, error: null }
}

// Fetch full client details with all related data
export async function getClientDetails(clientId: string) {
   const { supabase } = await getAuthenticatedUser()

  // Fetch client
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()

  if (clientError || !client) return { error: clientError?.message || 'Client not found', data: null }

const { data: appointment } = await supabase
  .from('appointments')
  .select('*')
  .eq('client_id', clientId)
  .eq('status', 'Accepted')
  .order('created_at', { ascending: false })
  .limit(1)
  .single()

// Fetch application form separately
let applicationForm = null
if (appointment) {
  const { data } = await supabase
    .from('application_forms')
    .select('*')
    .eq('appointment_id', appointment.id)
    .single()
  applicationForm = data
}

  // Fetch student intake (Student only)
  const { data: studentIntake } = await supabase
    .from('student_intake')
    .select('*')
    .eq('client_id', clientId)
    .single()

  // Fetch parents details (Student only)
  const { data: parentsDetails } = await supabase
    .from('parents_details')
    .select('*')
    .eq('client_id', clientId)
    .single()

  // Fetch assessment report (Student only)
  const { data: assessmentReport } = await supabase
    .from('assessment_reports')
    .select('*')
    .eq('client_id', clientId)
    .single()

  // Fetch mental status exam (Client only)
  let mentalStatusExam = null
  if (appointment) {
    const { data } = await supabase
      .from('mental_status_exams')
      .select('*')
      .eq('appointment_id', appointment.id)
      .single()
    mentalStatusExam = data
  }

  // Fetch remediation entries (Student)
  const { data: remediationEntries } = await supabase
    .from('remediation_entries')
    .select('*')
    .eq('client_id', clientId)
    .order('sort_order', { ascending: true })

  // Fetch plan entries (Client)
  let planEntries: typeof remediationEntries = []
  if (appointment) {
    const { data } = await supabase
      .from('plan_entries')
      .select('*')
      .eq('appointment_id', appointment.id)
      .order('sort_order', { ascending: true })
    planEntries = data || []
  }

  return {
    error: null,
    data: {
      client,
      appointment,
      applicationForm,
      studentIntake,
      parentsDetails,
      assessmentReport,
      mentalStatusExam,
      remediationEntries: remediationEntries || [],
      planEntries: planEntries || [],
    },
  }
}

// Save application form
export async function saveApplicationForm(appointmentId: string, currentProblem: string) {
   const { supabase } = await getAuthenticatedUser()

  const { error } = await supabase
    .from('application_forms')
    .upsert({ appointment_id: appointmentId, current_problem: currentProblem }, { onConflict: 'appointment_id' })

  if (error) return { error: error.message }
  return { success: true }
}

// Save client basic info
export async function saveClientInfo(clientId: string, data: {
  name: string
  age: string
  relative: string
  address: string
}) {
   const { supabase } = await getAuthenticatedUser()

  const { error } = await supabase
    .from('clients')
    .update(data)
    .eq('id', clientId)

  if (error) return { error: error.message }
  return { success: true }
}

// Save student intake form
// REPLACE saveStudentIntake
export async function saveStudentIntake(clientId: string, data: Record<string, string>) {
   const { supabase } = await getAuthenticatedUser()

  const { error } = await supabase
    .from('student_intake')
    .upsert(
      { client_id: clientId, form_data: data },
      { onConflict: 'client_id' }
    )

  if (error) return { error: error.message }
  return { success: true }
}

// REPLACE saveParentsDetails
export async function saveParentsDetails(clientId: string, data: Record<string, string>) {
   const { supabase } = await getAuthenticatedUser()

  const { error } = await supabase
    .from('parents_details')
    .upsert(
      { client_id: clientId, form_data: data },
      { onConflict: 'client_id' }
    )

  if (error) return { error: error.message }
  return { success: true }
}

// REPLACE saveAssessmentReport
export async function saveAssessmentReport(clientId: string, data: Record<string, string>) {
   const { supabase } = await getAuthenticatedUser()

  const { error } = await supabase
    .from('assessment_reports')
    .upsert(
      { client_id: clientId, form_data: data },
      { onConflict: 'client_id' }
    )

  if (error) return { error: error.message }
  return { success: true }
}

// Save mental status exam
export async function saveMentalStatusExam(appointmentId: string, data: Record<string, any>) {
   const { supabase } = await getAuthenticatedUser()

  const { error } = await supabase
    .from('mental_status_exams')
    .upsert(
      { appointment_id: appointmentId, form_data: data },
      { onConflict: 'appointment_id' }
    )

  if (error) return { error: error.message }
  return { success: true }
}

// Add a remediation entry
export async function addRemediationEntry(clientId: string, data: {
  entry_date?: string
  remediation_given: string
  improvement_seen: string
  sort_order: number
}) {
   const { supabase } = await getAuthenticatedUser()

  const { data: entry, error } = await supabase
    .from('remediation_entries')
    .insert({ client_id: clientId, ...data })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { success: true, id: entry.id }
}

// Update a remediation entry
export async function updateRemediationEntry(entryId: string, data: {
  entry_date?: string
  remediation_given?: string
  improvement_seen?: string
}) {
   const { supabase } = await getAuthenticatedUser()

  const { error } = await supabase
    .from('remediation_entries')
    .update(data)
    .eq('id', entryId)

  if (error) return { error: error.message }
  return { success: true }
}

// Delete a remediation entry
export async function deleteRemediationEntry(entryId: string) {
   const { supabase } = await getAuthenticatedUser()

  const { error } = await supabase
    .from('remediation_entries')
    .delete()
    .eq('id', entryId)

  if (error) return { error: error.message }
  return { success: true }
}

// Add a plan entry
export async function addPlanEntry(appointmentId: string, data: {
  entry_date?: string
  plan_recommendation: string
  improvement_seen: string
  doctor_signature: string
  sort_order: number
}) {
   const { supabase } = await getAuthenticatedUser()

  const { data: entry, error } = await supabase
    .from('plan_entries')
    .insert({ appointment_id: appointmentId, ...data })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { success: true, id: entry.id }
}

// Update a plan entry
export async function updatePlanEntry(entryId: string, data: {
  entry_date?: string
  plan_recommendation?: string
  improvement_seen?: string
  doctor_signature?: string
}) {
   const { supabase } = await getAuthenticatedUser()

  const { error } = await supabase
    .from('plan_entries')
    .update(data)
    .eq('id', entryId)

  if (error) return { error: error.message }
  return { success: true }
}

// Delete a plan entry
export async function deletePlanEntry(entryId: string) {
   const { supabase } = await getAuthenticatedUser()

  const { error } = await supabase
    .from('plan_entries')
    .delete()
    .eq('id', entryId)

  if (error) return { error: error.message }
  return { success: true }
}

// Get database storage usage
export async function getStorageUsage() {
   const { supabase } = await getAuthenticatedUser()

  const { data, error } = await supabase
    .rpc('get_db_size')

  if (error) return { error: error.message, used: 0, limit: 500 }
  return { used: data || 0, limit: 500, error: null } // 500 MB free tier
}

// Delete all appointment data older than a given date
export async function deleteDataBeforeDate(beforeDate: string) {
    const { supabase, user } = await getAuthenticatedUser()
const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'Admin access required', deleted: 0 }
  // Get appointments before the date
  const { data: oldAppointments } = await supabase
    .from('appointments')
    .select('id, client_id')
    .lt('created_at', beforeDate)

  if (!oldAppointments || oldAppointments.length === 0) {
    return { deleted: 0, error: null }
  }

  const appointmentIds = oldAppointments.map((a) => a.id)
  const clientIds = [...new Set(oldAppointments.map((a) => a.client_id))]

  // Check which clients still have newer appointments
  const { data: activeClients } = await supabase
    .from('appointments')
    .select('client_id')
    .gte('created_at', beforeDate)
    .in('client_id', clientIds)

  const activeClientIds = new Set((activeClients || []).map((a) => a.client_id))
  const orphanedClientIds = clientIds.filter((id) => !activeClientIds.has(id))

  // Delete in order (cascades handle related tables)
  // 1. Delete old appointments (cascades: application_forms, mental_status_exams, plan_entries)
  const { error: aptError } = await supabase
    .from('appointments')
    .delete()
    .in('id', appointmentIds)

  if (aptError) return { error: aptError.message, deleted: 0 }

  // 2. Delete orphaned clients (cascades: student_intake, parents_details, assessment_reports, remediation_entries)
  if (orphanedClientIds.length > 0) {
    await supabase
      .from('clients')
      .delete()
      .in('id', orphanedClientIds)
  }

  return { deleted: oldAppointments.length, error: null }
}

// Update an existing appointment's client details
export async function updateAppointmentDetails(
  appointmentId: string,
  clientId: string,
  values: {
    name: string
    age: string
    relative: string
    address: string
    countryCode: string
    phone: string
    clientType: 'Student' | 'Client'
    scheduledDate?: string
  }
) {
   const { supabase } = await getAuthenticatedUser()

  // Update client info
  const { error: clientError } = await supabase
    .from('clients')
    .update({
      name: values.name,
      age: values.age,
      relative: values.relative,
      address: values.address,
      country_code: values.countryCode,
      phone: values.phone,
      client_type: values.clientType,
    })
    .eq('id', clientId)

  if (clientError) return { error: clientError.message }

  // Update appointment date if provided
  if (values.scheduledDate) {
    const { error: aptError } = await supabase
      .from('appointments')
      .update({ scheduled_date: values.scheduledDate })
      .eq('id', appointmentId)

    if (aptError) return { error: aptError.message }
  }

  return { success: true }
}

// Dashboard stats
export async function getDashboardStats() {
 const { supabase, user } = await getAuthenticatedUser()
  const today = new Date().toISOString().split('T')[0]

  const [total, pending, accepted, todays, clients, students, normals] = await Promise.all([
    supabase.from('appointments').select('*', { count: 'exact', head: true }),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'Accepted'),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('scheduled_date', today),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('client_type', 'Student'),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('client_type', 'Client'),
  ])

  return {
    totalAppointments: total.count || 0,
    pendingAppointments: pending.count || 0,
    acceptedAppointments: accepted.count || 0,
    todayAppointments: todays.count || 0,
    totalClients: clients.count || 0,
    studentClients: students.count || 0,
    normalClients: normals.count || 0,
  }
}

// Fetch client basic info by ID
export async function getClientById(clientId: string) {
   const { supabase } = await getAuthenticatedUser()

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()

  if (error) return { error: error.message, client: null }
  return { client: data, error: null }
}