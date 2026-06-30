import { supabase } from './supabaseClient'

const SUPABASE_FUNCTION_URL = 'https://qgdepdklhfacrayfuhiv.supabase.co/functions/v1/smartpay-proxy'

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token ?? ''}`,
  }
}

export async function stkPush(phone: string, amount: number, reference: string) {
  const res = await fetch(SUPABASE_FUNCTION_URL, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({
      action: 'stk_push',
      payload: { phone, amount, account_reference: reference },
    }),
  })
  return res.json()
}

export async function sendSMS(phone: string, message: string) {
  const res = await fetch(SUPABASE_FUNCTION_URL, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({
      action: 'send_sms',
      payload: { phone, message },
    }),
  })
  return res.json()
}

export async function checkTransaction(checkoutRequestId: string) {
  const res = await fetch(SUPABASE_FUNCTION_URL, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({
      action: 'check_transaction',
      payload: { checkout_request_id: checkoutRequestId },
    }),
  })
  return res.json()
}
