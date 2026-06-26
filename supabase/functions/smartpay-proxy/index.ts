import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SMARTPAY_BASE = 'https://api.smartpaypesa.com/v1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get API keys from database
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', ['smartpay_collections_api_key', 'smartpay_sms_api_key'])

    const getSetting = (key: string) => settings?.find((s: any) => s.key === key)?.value || ''

    let result: any = { success: false, message: 'Unknown action' }

    if (action === 'stk_push') {
      const apiKey = getSetting('smartpay_collections_api_key')
      const res = await fetch(`${SMARTPAY_BASE}/stk/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          phone: payload.phone,
          amount: payload.amount,
          account_reference: payload.account_reference || 'KISII_EATS',
        }),
      })
      result = await res.json()
    }

    if (action === 'send_sms') {
      const apiKey = getSetting('smartpay_sms_api_key')
      const res = await fetch(`${SMARTPAY_BASE}/sms/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          phone: payload.phone,
          message: payload.message,
        }),
      })
      result = await res.json()
    }

    if (action === 'check_transaction') {
      const apiKey = getSetting('smartpay_collections_api_key')
      const res = await fetch(`${SMARTPAY_BASE}/transactions/${payload.checkout_request_id}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })
      result = await res.json()
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: (err as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
