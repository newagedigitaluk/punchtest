
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Triggering punch machine activation')
    
    // Parse the trigger request
    const triggerData = await req.json()
    console.log('Trigger data payload:', JSON.stringify(triggerData, null, 2))

    // Extract trigger information
    const { 
      clientTransactionId,
      punchMachineUrl,
      timestamp = new Date().toISOString()
    } = triggerData

    console.log(`Sending punch activation for transaction ${clientTransactionId}`)

    // Validate required fields
    if (!clientTransactionId || !punchMachineUrl) {
      console.error('Missing required fields:', { clientTransactionId, punchMachineUrl })
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: clientTransactionId and punchMachineUrl'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Prepare webhook payload for the Raspberry Pi
    const webhookPayload = {
      event: 'payment_completed',
      clientTransactionId,
      timestamp,
      amount: 1.00,
      currency: 'GBP',
      status: 'paid',
      message: 'Payment successful - activate punch machine'
    }

    console.log(`Sending webhook to Pi at: ${punchMachineUrl}`)

    // Send webhook to Raspberry Pi
    const response = await fetch(punchMachineUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-PunchMachine/1.0'
      },
      body: JSON.stringify(webhookPayload)
    })

    if (!response.ok) {
      throw new Error(`Pi webhook failed: ${response.status} ${response.statusText}`)
    }

    const piResponse = await response.text()
    console.log('Pi response:', piResponse)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Punch machine activation sent successfully',
        clientTransactionId,
        piResponse,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Punch trigger error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
