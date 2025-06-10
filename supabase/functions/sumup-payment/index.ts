
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

    // For physical readers, we need to use a different approach
    // Instead of trying to "process" the checkout, we need to send it to the reader for customer interaction
    if (readerId && checkoutData.id) {
      console.log(`Attempting to send checkout ${checkoutData.id} to reader ${readerId}`)
      
      try {
        // Use the reader-specific endpoint to send the checkout
        const readerCheckoutUrl = `https://api.sumup.com/v0.1/merchants/${merchantCode}/readers/${readerId}/checkout`
        
        const readerPayload = {
          checkout_id: checkoutData.id
        }
        
        console.log('Sending checkout to reader with payload:', JSON.stringify(readerPayload))
        
        const readerResponse = await fetch(readerCheckoutUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(readerPayload)
        })

        console.log('Reader response status:', readerResponse.status)
        
        if (readerResponse.ok) {
          const readerData = await readerResponse.json()
          console.log('Checkout sent to reader successfully:', JSON.stringify(readerData))
        } else {
          const readerError = await readerResponse.text()
          console.warn('Failed to send checkout to reader:', readerError)
          
          // If the reader endpoint doesn't work, the checkout is still created
          // The customer might need to manually select the payment on the reader
          console.log('Checkout created but not automatically sent to reader. Customer may need to manually start payment on reader.')
        }
      } catch (readerError) {
        console.warn('Reader communication failed but checkout was created:', readerError)
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
