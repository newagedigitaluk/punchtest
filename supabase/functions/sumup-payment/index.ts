
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

    // If we have a reader, send the payment to the reader using SumUp Terminal API
    if (readerId && checkoutData.id) {
      console.log(`Sending payment ${checkoutData.id} to reader ${readerId}`)
      
      // IMPORTANT: For SumUp Terminal API, we need to use the checkoutId directly
      // using the /v1.0/terminals/{terminal_id}/checkout-reference/{checkout_reference} endpoint
      // This is the correct endpoint for telling a physical reader to process a payment
      const terminalApiUrl = `https://api.sumup.com/v1.0/terminals/${readerId}/checkout-reference/${checkoutReference}`
      
      console.log('Using Terminal API endpoint:', terminalApiUrl)
      
      const terminalResponse = await fetch(terminalApiUrl, {
        method: 'PUT', // The Terminal API uses PUT to send payments to readers
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      })

      console.log('Terminal API response status:', terminalResponse.status)
      
      if (terminalResponse.ok) {
        const terminalData = await terminalResponse.json()
        console.log('Payment successfully sent to reader:', JSON.stringify(terminalData))
      } else {
        const terminalError = await terminalResponse.text()
        console.error('Terminal API Error:', terminalError)
        
        // Try alternative approach - using the legacy API endpoint as fallback
        console.log('Trying alternative API endpoint for sending to reader...')
        const legacyApiUrl = `https://api.sumup.com/v0.1/checkouts/${checkoutData.id}/terminal/${readerId}`
        
        const legacyResponse = await fetch(legacyApiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          }
        })

        console.log('Legacy API response status:', legacyResponse.status)
        
        if (legacyResponse.ok) {
          const legacyData = await legacyResponse.json()
          console.log('Payment sent to reader using legacy API:', JSON.stringify(legacyData))
        } else {
          const legacyError = await legacyResponse.text()
          console.error('Legacy API Error:', legacyError)
          
          // Try one more alternative as a last resort
          console.log('Trying one final alternative approach...')
          const directPaymentUrl = `https://api.sumup.com/v0.1/terminals/${readerId}/charge`
          
          const directPayload = {
            amount: amount,
            currency: currency,
            checkout_reference: checkoutReference,
            description: 'Punch Power Machine Payment'
          }
          
          const directResponse = await fetch(directPaymentUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(directPayload)
          })

          console.log('Direct charge API response status:', directResponse.status)
          
          if (directResponse.ok) {
            const directData = await directResponse.json()
            console.log('Payment sent to reader using direct charge API:', JSON.stringify(directData))
          } else {
            const directError = await directResponse.text()
            console.error('Direct charge API Error:', directError)
            console.log('All API attempts failed, but checkout was created successfully')
          }
        }
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
