
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
        session_id: clientTransactionId,
        type: 'activate',
        timestamp: new Date().toISOString()
      })
    })

    console.log(`Pi response status: ${piResponse.status}`)
    const piResponseText = await piResponse.text()
    console.log(`Pi response: ${piResponseText}`)

    if (!piResponse.ok) {
      console.error(`Pi webhook failed: ${piResponse.status} ${piResponse.statusText}`)
      console.error(`Pi response body: ${piResponseText}`)
      
      // Return error - payment processing should fail if Pi is not reachable
      return new Response(
        JSON.stringify({
          success: false,
          error: `Punch machine communication failed: ${piResponse.status}`,
          clientTransactionId
        }),
        {
          status: 500,
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
    
    // Return error - do not allow payment to succeed if there are communication issues
    return new Response(
      JSON.stringify({
        success: false,
        error: `Punch machine activation failed: ${error.message}`,
        clientTransactionId: null
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
