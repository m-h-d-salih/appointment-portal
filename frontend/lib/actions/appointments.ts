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
        scheduled_time,
        location,
        appointment_days,
        created_at
      )
    `)
    .eq('phone', phone)
     .eq('is_deleted', false)
    .order('created_at', { referencedTable: 'appointments', ascending: false })
    .single()

  if (error || !client) return { client: null, appointments: [], latestAppointment: null }

  const appointments = client.appointments || []
  const latest = appointments[0] || null

  return {
    client,
    appointments,
    latestAppointment: latest ? {
      location: latest.location || '',
      appointmentDays: latest.appointment_days || [],
      scheduledTime: latest.scheduled_time || '',
    } : null,
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
   scheduledTime?: string 
   location?: string           // ← add
  appointmentDays?: string[]  
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
      location: values.location || 'Kodinhi Cheruppara, Malappuram',
      appointment_days: values.appointmentDays || [],
      created_by: user.id,
      scheduled_time: values.scheduledTime || null,
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
      id, status, scheduled_date,scheduled_time, location, appointment_days, notes, created_at,
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
 
  // Filter by appointed date range (scheduled_date)
  if (dateFrom) {
    query = query.gte('scheduled_date', dateFrom)
  }
  if (dateTo) {
    query = query.lte('scheduled_date', dateTo)
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
      scheduledTime: apt.scheduled_time || '',
      location: apt.location || 'Kodinhi Cheruppara, Malappuram',
appointmentDays: apt.appointment_days || [],
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
  const supabase = await createClient()
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

  // Step 1: Get client IDs with their latest scheduled date
  let appointmentQuery = supabase
    .from('appointments')
    .select('client_id, scheduled_date,scheduled_time,location,appointment_days')
    .eq('status', 'Accepted')
    .order('scheduled_date', { ascending: false })

  if (dateFrom) {
    appointmentQuery = appointmentQuery.gte('scheduled_date', dateFrom)
  }
  if (dateTo) {
    appointmentQuery = appointmentQuery.lte('scheduled_date', dateTo)
  }

  const { data: matchingAppointments } = await appointmentQuery

  if (!matchingAppointments || matchingAppointments.length === 0) {
    return { clients: [], total: 0, error: null }
  }

  // Get unique client IDs ordered by their latest appointment date
  const clientOrder: string[] = []
  const latestTimes = new Map<string, string>()
  const latestDates = new Map<string, string>()
  const latestLocations = new Map<string, string>() 
  const latestDays = new Map<string, string[]>()
  for (const apt of matchingAppointments) {
    if (!latestDates.has(apt.client_id)) {
      latestDates.set(apt.client_id, apt.scheduled_date || '')
       latestTimes.set(apt.client_id, apt.scheduled_time || '')
        latestLocations.set(apt.client_id, apt.location || '')
         latestDays.set(apt.client_id, apt.appointment_days || []) 
      clientOrder.push(apt.client_id)
    }
  }

  // Step 2: Query clients
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
    .eq('is_deleted', false)
    .in('id', clientOrder)

  if (clientType && clientType !== 'all') {
    query = query.eq('client_type', clientType)
  }

  if (search && search.trim()) {
    query = query.or(`name.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%`)
  }

  const { data, count, error } = await query

  if (error) return { error: error.message, clients: [], total: 0 }

const { data: paymentData } = await supabase
  .from('client_payments')
  .select('client_id, total_amount')

const { data: allPaymentEntries } = await supabase
  .from('transactions')
  .select('client_id, amount_paise')
  .eq('type', 'income')
  .neq('status', 'void')
  .not('client_id', 'is', null)

const paymentTotals = new Map<string, { totalAmount: number; totalPaid: number }>()
const { data: attendanceData } = await supabase
  .from('student_attendance')
  .select('client_id')

const attendanceCounts = new Map<string, number>()
for (const a of (attendanceData || [])) {
  attendanceCounts.set(a.client_id, (attendanceCounts.get(a.client_id) || 0) + 1)
}
for (const p of (paymentData || [])) {
  paymentTotals.set(p.client_id, { totalAmount: Number(p.total_amount), totalPaid: 0 })
}
for (const e of (allPaymentEntries || [])) {
  if (!e.client_id) continue
  const existing = paymentTotals.get(e.client_id)
  if (existing) {
    existing.totalPaid += Number(e.amount_paise) / 100
  } else {
    paymentTotals.set(e.client_id, { totalAmount: 0, totalPaid: Number(e.amount_paise) / 100 })
  }
}

const clientsWithPayment = new Set(paymentTotals.keys())
  const seen = new Set<string>()
  const clientsMap = new Map<string, any>()

  for (const c of (data || [])) {
    if (seen.has(c.id)) continue
    seen.add(c.id)

    const appts = c.appointments as unknown as {
      id: string
      status: string
      scheduled_date: string | null
      created_at: string
    }[]

    clientsMap.set(c.id, {
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
      scheduledDate: latestDates.get(c.id) || '',
      scheduledTime: latestTimes.get(c.id) || '',
      hasPayment: clientsWithPayment.has(c.id),
  paymentSummary: paymentTotals.get(c.id) || null,
   attendanceCount: attendanceCounts.get(c.id) || 0,
   location: latestLocations.get(c.id) || '',
   appointmentDays: latestDays.get(c.id) || [],
    })
  }

  // Sort by latest appointment date (newest first), then paginate
  const sorted = clientOrder
    .filter((id) => clientsMap.has(id))
    .map((id) => clientsMap.get(id))

  const paginated = sorted.slice(from, to + 1)

  return { clients: paginated, total: sorted.length, error: null }
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

  const { data: paymentConfig } = await supabase
  .from('client_payments')
  .select('*')
  .eq('client_id', clientId)
  .single()

const { data: paymentEntries } = await supabase
  .from('payment_entries')
  .select('*')
  .eq('client_id', clientId)
  .order('date', { ascending: true })

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
          paymentConfig: paymentConfig ? {
      totalAmount: Number(paymentConfig.total_amount),
      notes: paymentConfig.notes || '',
      payments: (paymentEntries || []).map((e: any) => ({
        id: e.id,
        date: e.date,
        amount: Number(e.amount),
        category: e.category || '',
        payment_method: e.payment_method || '',
        reference: e.reference || '',
        notes: e.notes || '',
      })),
    } : null,
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

  // 1. Delete old appointments (cascades: application_forms, mental_status_exams, plan_entries)
  const { error: aptError } = await supabase
    .from('appointments')
    .delete()
    .in('id', appointmentIds)

  if (aptError) return { error: aptError.message, deleted: 0 }

  // 2. Clean up orphaned clients — delete related data first, then soft-delete client
  if (orphanedClientIds.length > 0) {
    // Delete student attendance for orphaned clients
    await supabase
      .from('student_attendance')
      .delete()
      .in('client_id', orphanedClientIds)

    // Delete client payment configs for orphaned clients
    await supabase
      .from('client_payments')
      .delete()
      .in('client_id', orphanedClientIds)

    // Void transactions for orphaned clients (soft delete — keeps audit trail)
    await supabase
      .from('transactions')
      .update({ status: 'void', updated_at: new Date().toISOString() })
      .in('client_id', orphanedClientIds)
      .eq('status', 'active')

    // Soft-delete orphaned clients
    await supabase
      .from('clients')
      .update({ is_deleted: true })
      .in('id', orphanedClientIds)
  }

  // 3. Delete old bank transfers before the date
  await supabase
    .from('bank_transfers')
    .delete()
    .lt('created_at', beforeDate)

  // 4. Hard-delete voided transactions before the date (already excluded from totals)
  await supabase
    .from('transaction_audit')
    .delete()
    .in('transaction_id',
      (await supabase
        .from('transactions')
        .select('id')
        .eq('status', 'void')
        .lt('created_at', beforeDate)
      ).data?.map((t) => t.id) || []
    )

  await supabase
    .from('transactions')
    .delete()
    .eq('status', 'void')
    .lt('created_at', beforeDate)

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
     scheduledTime?: string 
      location?: string           // ← add
  appointmentDays?: string[]
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

  // / NEW — always update appointment fields
const { error: aptError } = await supabase
  .from('appointments')
  .update({
    scheduled_date: values.scheduledDate || undefined,
    scheduled_time: values.scheduledTime || undefined,
    location: values.location || 'Kodinhi Cheruppara, Malappuram',
    appointment_days: values.appointmentDays || [],
  })
  .eq('id', appointmentId)

if (aptError) return { error: aptError.message }

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
  supabase.from('clients').select('id, appointments!inner(id)', { count: 'exact', head: true }).eq('is_deleted', false),
  supabase.from('clients').select('id, appointments!inner(id)', { count: 'exact', head: true }).eq('client_type', 'Student').eq('is_deleted', false),
  supabase.from('clients').select('id, appointments!inner(id)', { count: 'exact', head: true }).eq('client_type', 'Client').eq('is_deleted', false),
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

// Export all data for backup
export async function getAllDataForExport() {
  const { supabase, user } = await getAuthenticatedUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'Admin access required', data: null }

  async function fetchAll(table: string, orderBy = 'created_at') {
    const rows: any[] = []
    let from = 0
    const batchSize = 1000

    while (true) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order(orderBy, { ascending: false })
        .range(from, from + batchSize - 1)

      if (error || !data || data.length === 0) break
      rows.push(...data)
      if (data.length < batchSize) break
      from += batchSize
    }

    return rows
  }

  const [clients, appointments, applicationForms, studentIntake, parentsDetails, assessmentReports, mentalStatusExams, remediationEntries, transactions, studentAttendance] = await Promise.all([
    fetchAll('clients'),
    fetchAll('appointments'),
    fetchAll('application_forms', 'appointment_id'),
    fetchAll('student_intake', 'client_id'),
    fetchAll('parents_details', 'client_id'),
    fetchAll('assessment_reports', 'client_id'),
    fetchAll('mental_status_exams', 'appointment_id'),
    fetchAll('remediation_entries', 'sort_order'),
    fetchAll('transactions'),
    fetchAll('student_attendance', 'attendance_no'),
  ])

  return {
    error: null,
    data: { clients, appointments, applicationForms, studentIntake, parentsDetails, assessmentReports, mentalStatusExams, remediationEntries, transactions, studentAttendance },
  }
}

// Get payment config for a client
export async function getClientPaymentConfig(clientId: string) {
  const { supabase } = await getAuthenticatedUser()

  const { data: config } = await supabase
    .from('client_payments')
    .select('*')
    .eq('client_id', clientId)
    .single()

  // Read payments from transactions table
  const { data: entries } = await supabase
    .from('transactions')
    .select('*')
    .eq('client_id', clientId)
    .eq('type', 'income')
    .neq('status', 'void')
    .order('date', { ascending: true })

  const payments = (entries || []).map((e) => ({
    id: e.id,
    date: e.date,
    amount: Number(e.amount_paise) / 100,
    category: e.category || '',
    payment_method: e.payment_method || '',
    reference: e.reference || '',
    notes: e.notes || '',
  }))

  // Return config even if total fee not set — payments may exist from attendance
  if (!config && payments.length === 0) return { config: null }

  return {
    config: {
      totalAmount: config ? Number(config.total_amount) : 0,
      notes: config?.notes || '',
      payments,
    },
  }
}

// Save payment config (total fee + notes)
export async function saveClientPaymentConfig(clientId: string, totalAmount: number, notes: string) {
  const { supabase } = await getAuthenticatedUser()

  const { error } = await supabase
    .from('client_payments')
    .upsert(
      { client_id: clientId, total_amount: totalAmount, notes, updated_at: new Date().toISOString() },
      { onConflict: 'client_id' }
    )

  if (error) return { error: error.message }
  return { success: true }
}

// Add a payment entry
export async function addPaymentEntry(clientId: string, entry: {
  date: string
  amount: number
  category: string
  payment_method: string
  reference: string
  notes: string
}) {
  const { supabase, user } = await getAuthenticatedUser()

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      type: 'income',
      date: entry.date,
      payee: '', // will be filled with client name below
      category: entry.category,
      amount_paise: Math.round(entry.amount * 100),
      payment_method: entry.payment_method,
      reference: entry.reference,
      notes: entry.notes,
      client_id: clientId,
      status: 'active',
      version: 1,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // Set payee to client name
  const { data: client } = await supabase
    .from('clients')
    .select('name')
    .eq('id', clientId)
    .single()

  if (client) {
    await supabase
      .from('transactions')
      .update({ payee: client.name })
      .eq('id', data.id)
  }

  // Audit log
  await supabase.from('transaction_audit').insert({
    transaction_id: data.id,
    action: 'Created',
    actor: user.email || '',
    after_data: { type: 'income', amount: entry.amount, client_id: clientId },
  })

  return { success: true, id: data.id }
}

// Get attendance records for a student
export async function getStudentAttendance(clientId: string) {
  const { supabase } = await getAuthenticatedUser()

  const { data, error } = await supabase
    .from('student_attendance')
    .select('*')
    .eq('client_id', clientId)
    .order('attendance_no', { ascending: false })

  if (error) return { records: [], error: error.message }

  return {
    records: (data || []).map((r) => ({
      id: r.id,
      attendanceNo: r.attendance_no,
      date: r.date,
      paidAmount: Number(r.paid_amount || 0),
      paymentMethod: r.payment_method || '',
      notes: r.notes || '',
    })),
    error: null,
  }
}

// Add attendance record
export async function addStudentAttendance(clientId: string, record: {
  attendanceNo: number
  date: string
  paidAmount: number
  paymentMethod?: string
  notes?: string
}) {
  const { supabase, user } = await getAuthenticatedUser()

  // Save attendance record
  const { data, error } = await supabase
    .from('student_attendance')
    .insert({
      client_id: clientId,
      attendance_no: record.attendanceNo,
      date: record.date,
      paid_amount: record.paidAmount,
      payment_method: record.paymentMethod || '',
      notes: record.notes || '',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // If payment was made, save to transactions table
  if (record.paidAmount > 0) {
    // Get client name
    const { data: client } = await supabase
      .from('clients')
      .select('name')
      .eq('id', clientId)
      .single()

    await supabase
      .from('transactions')
      .insert({
        type: 'income',
        date: record.date,
        payee: client?.name || '',
        category: 'Session fee',
        amount_paise: Math.round(record.paidAmount * 100),
        payment_method: record.paymentMethod || 'Cash',
        reference: `Attendance #${record.attendanceNo}`,
        notes: record.notes || '',
        client_id: clientId,
        status: 'active',
        version: 1,
        created_by: user.id,
      })
  }

  return { success: true, id: data.id }
}

export async function deleteStudentAttendance(attendanceId: string) {
  const { supabase } = await getAuthenticatedUser()

  // Get the attendance record first (to check if it had a payment)
  const { data: record } = await supabase
    .from('student_attendance')
    .select('*')
    .eq('id', attendanceId)
    .single()

  if (!record) return { error: 'Record not found' }

  // Delete attendance record
  const { error } = await supabase
    .from('student_attendance')
    .delete()
    .eq('id', attendanceId)

  if (error) return { error: error.message }

  // If it had a payment, void the matching transaction (don't delete — keeps accounts intact)
  if (record.paid_amount > 0) {
    await supabase
      .from('transactions')
      .update({ status: 'void', updated_at: new Date().toISOString() })
      .eq('client_id', record.client_id)
      .eq('reference', `Attendance #${record.attendance_no}`)
      .eq('status', 'active')
  }

  return { success: true }
}

export async function deletePaymentEntry(transactionId: string) {
  const { supabase } = await getAuthenticatedUser()

  // Void the transaction (don't hard delete — keeps audit trail)
  const { error } = await supabase
    .from('transactions')
    .update({ status: 'void', updated_at: new Date().toISOString() })
    .eq('id', transactionId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function softDeleteClient(clientId: string) {
  const { supabase } = await getAuthenticatedUser()

  const { error } = await supabase
    .from('clients')
    .update({ is_deleted: true })
    .eq('id', clientId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function restoreClient(clientId: string) {
  const { supabase } = await getAuthenticatedUser()

  const { error } = await supabase
    .from('clients')
    .update({ is_deleted: false })
    .eq('id', clientId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function getClientDependencies(clientId: string) {
  const { supabase } = await getAuthenticatedUser()

  const [appointments, transactions, attendance] = await Promise.all([
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('client_id', clientId),
    supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'active'),
    supabase.from('student_attendance').select('*', { count: 'exact', head: true }).eq('client_id', clientId),
  ])

  return {
    appointments: appointments.count || 0,
    payments: transactions.count || 0,
    attendance: attendance.count || 0,
  }
}