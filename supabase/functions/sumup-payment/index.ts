
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

    // Create checkout with SumUp API - ensuring it's sent to the reader
    const checkoutResponse = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkout_reference: `punch-${Date.now()}`,
        amount: amount,
        currency: currency,
        merchant_code: merchantId,
        description: 'Punch Power Machine Payment',
        pay_to_email: isTestMode ? 'test@punchpower.com' : 'payments@punchpower.com',
        card_reader_id: readerId, // Use card_reader_id instead of reader_id
        payment_type: 'card'
      })
    })

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.text()
      console.error('SumUp API Error:', errorData)
      throw new Error(`SumUp API error: ${checkoutResponse.status} - ${errorData}`)
    }

    const checkoutData = await checkoutResponse.json()
    console.log('Checkout created successfully:', checkoutData.id)

    // After creating checkout, try to send it to the reader
    if (checkoutData.id) {
      console.log(`Attempting to send payment to reader ${readerId}`)
      
      // Send the payment to the reader
      const readerResponse = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutData.id}/process`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_type: 'card',
          card_reader_id: readerId
        })
      })

      if (!readerResponse.ok) {
        const readerErrorData = await readerResponse.text()
        console.error('Failed to send payment to reader:', readerErrorData)
        // Don't throw here, as the checkout was created successfully
        console.log('Payment created but not sent to reader automatically')
      } else {
        console.log('Payment successfully sent to reader')
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
        readerId: readerId
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
