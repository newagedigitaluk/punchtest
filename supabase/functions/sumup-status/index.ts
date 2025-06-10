
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StatusRequest {
  checkoutId: string
  isTestMode: boolean
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { checkoutId, isTestMode = true }: StatusRequest = await req.json()

    const apiKey = isTestMode 
      ? Deno.env.get('SUMUP_TEST_API_KEY')
      : Deno.env.get('SUMUP_LIVE_API_KEY')

    if (!apiKey) {
      throw new Error('SumUp API key not configured')
    }

    console.log(`Checking status for checkout: ${checkoutId}`)

    const statusResponse = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }
    })

    if (!statusResponse.ok) {
      throw new Error(`SumUp API error: ${statusResponse.status}`)
    }

    const statusData = await statusResponse.json()
    console.log('Payment status:', statusData.status)

    return new Response(
      JSON.stringify({
        success: true,
        status: statusData.status,
        amount: statusData.amount,
        currency: statusData.currency,
        transactionId: statusData.transaction_id,
        transactionCode: statusData.transaction_code,
        date: statusData.date
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Status check error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
