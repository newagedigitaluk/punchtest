
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

    console.log(`Creating SumUp checkout for ${amount} ${currency} in ${isTestMode ? 'test' : 'live'} mode`)
    console.log(`Using merchant code: ${merchantCode}`)

    // Verify reader exists and is paired if readerId is provided
    if (readerId) {
      console.log(`Verifying reader ${readerId} exists and is paired`)
      
      const readersResponse = await fetch(`https://api.sumup.com/v0.1/merchants/${merchantCode}/readers`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      })

      if (!readersResponse.ok) {
        throw new Error(`Failed to fetch readers: ${readersResponse.status}`)
      }

      const readersData = await readersResponse.json()
      const reader = readersData.items?.find((r: any) => r.id === readerId)
      
      if (!reader) {
        throw new Error(`Reader ${readerId} not found or not paired`)
      }
      
      if (reader.status !== 'paired') {
        throw new Error(`Reader ${readerId} is not paired (status: ${reader.status})`)
      }
      
      console.log(`Reader verified: ${reader.name || 'Unnamed'} (${reader.device?.model || 'Unknown model'})`)
    }

    // Generate internal reference for tracking
    const checkoutReference = `punch-${Date.now()}`
    
    // Convert amount to minor units (e.g., 100 for £1.00)
    const amountMinorUnits = Math.round(amount * 100)
    
    // Determine minor units based on currency
    let currencyMinorUnits = 2
    if (['JPY', 'KRW'].includes(currency)) {
      currencyMinorUnits = 0
    }

    // Use the correct Reader Checkout API endpoint from your working Python code
    const apiUrl = `https://api.sumup.com/v0.1/merchants/${merchantCode}/readers/${readerId}/checkout`
    
    const checkoutPayload = {
      total_amount: {
        value: amountMinorUnits,
        currency: currency,
        minor_unit: currencyMinorUnits
      },
      description: `Punch Power Machine Payment (${checkoutReference})`,
      return_url: "https://example.com/sumup_webhook_placeholder" // Required HTTPS URL
    }

    console.log('Creating reader checkout with payload:', JSON.stringify(checkoutPayload))
    console.log('Using API endpoint:', apiUrl)

    const checkoutResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutPayload)
    })

    console.log('Reader checkout response status:', checkoutResponse.status)

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.text()
      console.error('SumUp Reader Checkout API Error:', errorData)
      throw new Error(`SumUp Reader Checkout API error: ${checkoutResponse.status} - ${errorData}`)
    }

    const checkoutData = await checkoutResponse.json()
    console.log('Reader checkout created successfully:', JSON.stringify(checkoutData))

    // Extract the client_transaction_id from the response (this is what SumUp uses for webhooks)
    const clientTransactionId = checkoutData.data?.client_transaction_id
    
    if (!clientTransactionId) {
      console.error('No client_transaction_id in response:', checkoutData)
      throw new Error('No client_transaction_id returned from SumUp')
    }

    console.log(`Payment successfully sent to reader ${readerId}, client_transaction_id: ${clientTransactionId}`)

    return new Response(
      JSON.stringify({
        success: true,
        checkoutId: clientTransactionId, // Use client_transaction_id as the main ID
        checkoutReference: checkoutReference,
        clientTransactionId: clientTransactionId, // Also return separately for clarity
        amount: amount,
        currency: currency,
        readerId: readerId,
        status: 'PENDING',
        message: 'Payment sent to reader successfully',
        debug: {
          merchantCode: merchantCode,
          isTestMode: isTestMode,
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
