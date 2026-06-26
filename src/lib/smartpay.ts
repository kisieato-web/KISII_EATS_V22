const SUPABASE_FUNCTION_URL = 'https://qgdepdklhfacrayfuhiv.supabase.co/functions/v1/smartpay-proxy'

export async function stkPush(phone: string, amount: number, reference: string) {
  const res = await fetch(SUPABASE_FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'check_transaction',
      payload: { checkout_request_id: checkoutRequestId },
    }),
  })
  return res.json()
}
