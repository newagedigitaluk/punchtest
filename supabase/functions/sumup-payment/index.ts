
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

    // Create checkout using the correct API structure from documentation
    const checkoutReference = `punch-${Date.now()}`
    const checkoutPayload = {
      checkout_reference: checkoutReference,
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

    // Now we need to process the checkout to send it to the reader
    if (readerId && checkoutData.id) {
      console.log(`Attempting to process checkout ${checkoutData.id} on reader ${readerId}`)
      
      try {
        // According to SumUp documentation, we need to process the checkout
        // This typically involves sending a request to process the payment
        const processUrl = `https://api.sumup.com/v0.1/checkouts/${checkoutData.id}`
        
        const processResponse = await fetch(processUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment_type: 'card',
            installments: 1
          })
        })

        console.log('Process response status:', processResponse.status)
        
        if (processResponse.ok) {
          const processData = await processResponse.json()
          console.log('Checkout processing initiated:', JSON.stringify(processData))
        } else {
          const processError = await processResponse.text()
          console.warn('Failed to process checkout on reader:', processError)
          // Don't fail the whole request if processing fails
        }
      } catch (processError) {
        console.warn('Reader processing failed but checkout was created:', processError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkoutId: checkoutData.id,
        checkoutReference: checkoutReference,
        amount: amount,
        currency: currency,
        readerId: readerId,
        status: checkoutData.status || 'PENDING',
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
