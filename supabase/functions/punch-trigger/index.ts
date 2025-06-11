
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
    
    const { clientTransactionId, punchMachineUrl } = await req.json()
    console.log('Trigger data payload:', JSON.stringify({
      clientTransactionId,
      punchMachineUrl
    }, null, 2))

    console.log(`Sending punch activation for transaction ${clientTransactionId}`)

    // Send activation signal to Raspberry Pi
    console.log(`Sending webhook to Pi at: ${punchMachineUrl}`)
    
    const piResponse = await fetch(punchMachineUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({
        clientTransactionId: clientTransactionId,
        action: 'activate_punch_machine',
        timestamp: new Date().toISOString()
      })
    })

    console.log(`Pi response status: ${piResponse.status}`)
    const piResponseText = await piResponse.text()
    console.log(`Pi response: ${piResponseText}`)

    if (!piResponse.ok) {
      console.error(`Pi webhook failed: ${piResponse.status} ${piResponse.statusText}`)
      console.error(`Pi response body: ${piResponseText}`)
      
      // Return success anyway - the payment was successful, punch machine issue is separate
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment processed successfully, punch machine activation attempted',
          piError: `Pi communication failed: ${piResponse.status}`,
          clientTransactionId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Punch machine activated successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Punch machine activated successfully',
        clientTransactionId,
        piResponse: piResponseText
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Punch trigger error:', error)
    
    // Even if punch machine communication fails, the payment was successful
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment processed, punch machine communication issue',
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
