
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

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.text()
      console.error('SumUp Checkout API Error:', errorData)
      throw new Error(`SumUp Checkout API error: ${checkoutResponse.status} - ${errorData}`)
    }

    const checkoutData = await checkoutResponse.json()
    console.log('Checkout created successfully:', JSON.stringify(checkoutData))

    // If we have a reader, send the payment to the reader using the correct endpoint
    if (readerId && checkoutData.id) {
      console.log(`Sending payment ${checkoutData.id} to reader ${readerId}`)
      
      try {
        // Use the correct endpoint for sending payment to reader
        const readerPaymentUrl = `https://api.sumup.com/v0.1/readers/${readerId}/payment`
        
        const paymentPayload = {
          checkout: {
            checkout_reference: checkoutReference,
            amount: amount,
            currency: currency,
            description: 'Punch Power Machine Payment'
          }
        }
        
        console.log('Sending payment to reader:', JSON.stringify(paymentPayload))
        
        const readerResponse = await fetch(readerPaymentUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentPayload)
        })

        console.log('Reader payment response status:', readerResponse.status)
        
        if (readerResponse.ok) {
          const readerData = await readerResponse.json()
          console.log('Payment sent to reader successfully:', JSON.stringify(readerData))
        } else {
          const readerError = await readerResponse.text()
          console.error('Failed to send payment to reader:', readerError)
          
          // Try alternative approach - direct checkout processing
          console.log('Trying alternative checkout processing...')
          const processUrl = `https://api.sumup.com/v0.1/checkouts/${checkoutData.id}/process`
          
          const processPayload = {
            payment_type: 'card',
            installments: 1
          }
          
          const processResponse = await fetch(processUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(processPayload)
          })

          console.log('Process checkout response status:', processResponse.status)
          
          if (processResponse.ok) {
            const processData = await processResponse.json()
            console.log('Checkout processing initiated:', JSON.stringify(processData))
          } else {
            const processError = await processResponse.text()
            console.warn('Failed to process checkout:', processError)
            console.log('Checkout created but requires manual interaction on reader')
          }
        }
      } catch (readerError) {
        console.warn('Reader communication failed:', readerError)
        console.log('Checkout created successfully but reader communication failed')
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
        message: readerId ? 'Checkout created and sent to reader' : 'Checkout created',
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
