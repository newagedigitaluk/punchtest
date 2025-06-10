
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

    // Create checkout using the standard Checkouts API
    const checkoutPayload = {
      checkout_reference: `punch-${Date.now()}`, // Unique reference
      amount: amount,
      currency: currency,
      merchant_code: merchantCode,
      description: 'Punch Power Machine Payment'
    }

    console.log('Creating checkout with payload:', JSON.stringify(checkoutPayload))
    
    // Use the standard checkouts endpoint from SumUp API docs
    const apiUrl = 'https://api.sumup.com/v0.1/checkouts'
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
      console.error('SumUp Checkout API Error:', errorData)
      
      // Log more details for debugging
      console.error('Request details:')
      console.error('- URL:', apiUrl)
      console.error('- Method: POST')
      console.error('- Headers:', JSON.stringify({
        'Authorization': `Bearer ${apiKey.substring(0, 10)}...`,
        'Content-Type': 'application/json'
      }))
      console.error('- Body:', JSON.stringify(checkoutPayload))
      
      throw new Error(`SumUp Checkout API error: ${checkoutResponse.status} - ${errorData}`)
    }

    const checkoutData = await checkoutResponse.json()
    console.log('Checkout created successfully:', JSON.stringify(checkoutData))

    // If we have a reader ID, try to send the checkout to the reader
    if (readerId) {
      console.log(`Attempting to send checkout ${checkoutData.id} to reader ${readerId}`)
      
      try {
        // First verify the reader exists
        const readerResponse = await fetch(`https://api.sumup.com/v0.1/merchants/${merchantCode}/readers/${readerId}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          }
        })

        if (!readerResponse.ok) {
          console.warn('Reader verification failed, but checkout was created')
        } else {
          const readerData = await readerResponse.json()
          console.log('Reader found:', JSON.stringify(readerData))
          
          // Try to process the checkout on the reader
          // This might require a different API call - let's see what the response tells us
          console.log('Checkout created and reader verified')
        }
      } catch (readerError) {
        console.warn('Reader operation failed but checkout was created:', readerError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkoutId: checkoutData.id,
        amount: amount,
        currency: currency,
        readerId: readerId,
        status: 'PENDING',
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
