
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
  amount: number
  currency: string
  isTestMode: boolean
  readerId?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { amount, currency = 'GBP', isTestMode = true, readerId }: PaymentRequest = await req.json()

    // Get the appropriate API key and merchant ID based on mode
    const apiKey = isTestMode 
      ? Deno.env.get('SUMUP_TEST_API_KEY')
      : Deno.env.get('SUMUP_LIVE_API_KEY')
    
    const merchantCode = isTestMode
      ? Deno.env.get('SUMUP_TEST_MERCHANT_ID')
      : Deno.env.get('SUMUP_LIVE_MERCHANT_ID')

    if (!apiKey || !merchantCode) {
      throw new Error('SumUp credentials not configured')
    }

    if (!readerId) {
      throw new Error('Reader ID is required to send payment to reader')
    }

    console.log(`Creating SumUp reader checkout for ${amount} ${currency} in ${isTestMode ? 'test' : 'live'} mode`)
    console.log(`Using merchant code: ${merchantCode}`)
    console.log(`Using reader ID: ${readerId}`)

    // First, verify the reader exists and is paired
    console.log('Verifying reader exists and is paired...')
    const readerResponse = await fetch(`https://api.sumup.com/v0.1/merchants/${merchantCode}/readers/${readerId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }
    })

    console.log('Reader verification response status:', readerResponse.status)
    
    if (!readerResponse.ok) {
      const errorData = await readerResponse.text()
      console.error('Reader verification failed:', errorData)
      throw new Error(`Reader not found or not accessible: ${readerResponse.status} - ${errorData}`)
    }

    const readerData = await readerResponse.json()
    console.log('Reader verification successful:', JSON.stringify(readerData))

    if (readerData.status !== 'paired') {
      throw new Error(`Reader is not paired. Current status: ${readerData.status}`)
    }

    // Create Reader Checkout payload exactly as per SumUp API docs
    const checkoutPayload = {
      description: 'Punch Power Machine Payment',
      total_amount: {
        value: Math.round(amount * 100), // Convert to minor units (pence)
        currency: currency
      }
    }

    console.log('Creating reader checkout with payload:', JSON.stringify(checkoutPayload))
    
    // Use the exact endpoint from SumUp API docs: POST /v0.1/merchants/{merchant_code}/readers/{id}
    const apiUrl = `https://api.sumup.com/v0.1/merchants/${merchantCode}/readers/${readerId}`
    console.log('Using API endpoint:', apiUrl)

    const checkoutResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutPayload)
    })

    console.log('Checkout response status:', checkoutResponse.status)
    console.log('Checkout response headers:', JSON.stringify([...checkoutResponse.headers.entries()]))

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.text()
      console.error('SumUp Reader Checkout API Error:', errorData)
      
      // Log more details for debugging
      console.error('Request details:')
      console.error('- URL:', apiUrl)
      console.error('- Method: POST')
      console.error('- Headers:', JSON.stringify({
        'Authorization': `Bearer ${apiKey.substring(0, 10)}...`,
        'Content-Type': 'application/json'
      }))
      console.error('- Body:', JSON.stringify(checkoutPayload))
      
      throw new Error(`SumUp Reader Checkout API error: ${checkoutResponse.status} - ${errorData}`)
    }

    const checkoutData = await checkoutResponse.json()
    console.log('Reader checkout created successfully:', JSON.stringify(checkoutData))

    // Extract checkout ID from response - try multiple possible locations
    let checkoutId = null
    if (checkoutData.data && checkoutData.data.checkout_id) {
      checkoutId = checkoutData.data.checkout_id
    } else if (checkoutData.data && checkoutData.data.id) {
      checkoutId = checkoutData.data.id
    } else if (checkoutData.id) {
      checkoutId = checkoutData.id
    } else if (checkoutData.checkout_id) {
      checkoutId = checkoutData.checkout_id
    }

    console.log('Extracted checkout ID:', checkoutId)

    return new Response(
      JSON.stringify({
        success: true,
        checkoutId: checkoutId,
        amount: amount,
        currency: currency,
        readerId: readerId,
        readerName: readerData.name,
        status: 'SENT_TO_READER',
        debug: {
          merchantCode: merchantCode,
          isTestMode: isTestMode,
          readerStatus: readerData.status,
          rawResponse: checkoutData
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Payment creation error:', error)
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
