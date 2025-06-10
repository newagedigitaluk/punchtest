
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Punch results received from Raspberry Pi:', req.method)
    
    // Parse the results from the Pi
    const punchData = await req.json()
    console.log('Punch data payload:', JSON.stringify(punchData, null, 2))

    // Extract punch information
    const { 
      clientTransactionId,
      punchForce,
      timestamp,
      deviceId,
      status = 'completed'
    } = punchData

    console.log(`Punch results for transaction ${clientTransactionId}: ${punchForce}kg force`)

    // Validate required fields
    if (!clientTransactionId || punchForce === undefined) {
      console.error('Missing required fields:', { clientTransactionId, punchForce })
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: clientTransactionId and punchForce'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client for real-time updates
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Broadcast the punch results to the connected clients
    const channelName = `punch-results-${clientTransactionId}`
    
    await supabase.channel(channelName).send({
      type: 'broadcast',
      event: 'punch_completed',
      payload: {
        clientTransactionId,
        punchForce,
        status,
        timestamp: timestamp || new Date().toISOString(),
        deviceId,
        source: 'raspberry_pi'
      }
    })

    console.log(`Broadcasted punch results for ${channelName}: ${punchForce}kg`)

    // Also broadcast to a general punch machine channel for admin monitoring
    await supabase.channel('punch-machine-admin').send({
      type: 'broadcast',
      event: 'punch_recorded',
      payload: {
        clientTransactionId,
        punchForce,
        timestamp: timestamp || new Date().toISOString(),
        deviceId,
        status
      }
    })

    console.log('Admin notification sent for punch completion')

    // Return success response to the Pi
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Punch results received and processed successfully',
        clientTransactionId,
        punchForce,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Punch results processing error:', error)
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
