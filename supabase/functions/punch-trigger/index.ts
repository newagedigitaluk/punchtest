
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

    // Prepare the payload for the Pi
    const piPayload = {
      session_id: clientTransactionId,
      type: 'activate',
      timestamp: new Date().toISOString()
    }
    
    console.log('Payload being sent to Pi:', JSON.stringify(piPayload, null, 2))

    // Send activation signal to Raspberry Pi
    console.log(`Sending webhook to Pi at: ${punchMachineUrl}`)
    
    const piResponse = await fetch(punchMachineUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'Supabase-Edge-Function/1.0'
      },
      body: JSON.stringify(piPayload)
    })

    console.log(`Pi response status: ${piResponse.status}`)
    console.log(`Pi response status text: ${piResponse.statusText}`)
    
    // Log response headers to see if there are any clues
    console.log('Pi response headers:')
    for (const [key, value] of piResponse.headers.entries()) {
      console.log(`  ${key}: ${value}`)
    }
    
    const piResponseText = await piResponse.text()
    console.log(`Pi response body: ${piResponseText}`)

    if (!piResponse.ok) {
      console.error(`Pi webhook failed: ${piResponse.status} ${piResponse.statusText}`)
      console.error(`Pi response body: ${piResponseText}`)
      
      // Try to parse the error response to get more details
      try {
        const errorData = JSON.parse(piResponseText)
        console.error('Parsed Pi error data:', JSON.stringify(errorData, null, 2))
      } catch (parseError) {
        console.error('Could not parse Pi error response as JSON')
      }
      
      // Return error - payment processing should fail if Pi is not reachable
      return new Response(
        JSON.stringify({
          success: false,
          error: `Punch machine communication failed: ${piResponse.status} - ${piResponseText}`,
          clientTransactionId,
          piPayload: piPayload,
          piResponse: {
            status: piResponse.status,
            statusText: piResponse.statusText,
            body: piResponseText
          }
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
        piResponse: piResponseText,
        piPayload: piPayload
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
