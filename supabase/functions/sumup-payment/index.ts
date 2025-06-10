
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
    
    const merchantId = isTestMode
      ? Deno.env.get('SUMUP_TEST_MERCHANT_ID')
      : Deno.env.get('SUMUP_LIVE_MERCHANT_ID')

    if (!apiKey || !merchantId) {
      throw new Error('SumUp credentials not configured')
    }

    if (!readerId) {
      throw new Error('Reader ID is required to send payment to reader')
    }

    console.log(`Creating SumUp checkout for ${amount} ${currency} in ${isTestMode ? 'test' : 'live'} mode with reader ${readerId}`)

    // First, let's verify the reader is available
    console.log('Checking reader availability...')
    const readersResponse = await fetch('https://api.sumup.com/v0.1/me/devices', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }
    })

    if (readersResponse.ok) {
      const readersData = await readersResponse.json()
      console.log('Available readers:', JSON.stringify(readersData))
      
      const targetReader = readersData.find((reader: any) => reader.id === readerId)
      if (!targetReader) {
        console.error(`Reader ${readerId} not found in available readers`)
      } else {
        console.log(`Target reader found:`, JSON.stringify(targetReader))
      }
    } else {
      console.error('Failed to fetch readers:', await readersResponse.text())
    }

    // Create checkout - try without specifying reader first
    const checkoutPayload = {
      checkout_reference: `punch-${Date.now()}`,
      amount: amount,
      currency: currency,
      merchant_code: merchantId,
      description: 'Punch Power Machine Payment',
      pay_to_email: isTestMode ? 'test@punchpower.com' : 'payments@punchpower.com'
    }

    console.log('Creating checkout with payload:', JSON.stringify(checkoutPayload))

    const checkoutResponse = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutPayload)
    })

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.text()
      console.error('SumUp API Error:', errorData)
      throw new Error(`SumUp API error: ${checkoutResponse.status} - ${errorData}`)
    }

    const checkoutData = await checkoutResponse.json()
    console.log('Checkout created successfully:', JSON.stringify(checkoutData))

    // Now try to send the payment to the specific reader using multiple approaches
    if (checkoutData.id) {
      console.log(`Attempting to send payment ${checkoutData.id} to reader ${readerId}`)
      
      // Approach 1: Try the /process endpoint
      try {
        const processPayload = {
          payment_type: 'card'
        }
        
        console.log('Trying /process endpoint with payload:', JSON.stringify(processPayload))
        
        const processResponse = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutData.id}/process`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(processPayload)
        })

        const processResponseText = await processResponse.text()
        console.log(`Process response status: ${processResponse.status}`)
        console.log(`Process response body: ${processResponseText}`)

        if (processResponse.ok) {
          console.log('Payment successfully initiated via /process endpoint')
        } else {
          console.error('Process endpoint failed:', processResponseText)
          
          // Approach 2: Try updating the checkout to include the reader
          console.log('Trying to update checkout with reader ID...')
          
          const updateResponse = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutData.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...checkoutPayload,
              card_reader_id: readerId,
              payment_type: 'card'
            })
          })

          const updateResponseText = await updateResponse.text()
          console.log(`Update response status: ${updateResponse.status}`)
          console.log(`Update response body: ${updateResponseText}`)
        }
      } catch (error) {
        console.error('Error in payment processing:', error)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkoutId: checkoutData.id,
        checkoutReference: checkoutData.checkout_reference,
        amount: checkoutData.amount,
        currency: checkoutData.currency,
        status: checkoutData.status,
        readerId: readerId,
        debug: {
          merchantId: merchantId,
          isTestMode: isTestMode
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
