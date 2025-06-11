
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

    // Handle ping requests
    if (punchData.type === 'ping') {
      console.log('Received ping from machine:', punchData.machine_id)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Ping received',
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Extract punch information - handle both field name formats
    const { 
      session_id,
      clientTransactionId,
      force_kg,
      punchForce,
      timestamp,
      deviceId,
      machine_id,
      status = 'completed'
    } = punchData

    // Use the correct field names from your backend
    const finalClientTransactionId = session_id || clientTransactionId
    const finalPunchForce = force_kg || punchForce
    const finalDeviceId = deviceId || machine_id

    console.log(`Punch results for transaction ${finalClientTransactionId}: ${finalPunchForce}kg force`)

    // Validate required fields
    if (!finalClientTransactionId || finalPunchForce === undefined) {
      console.error('Missing required fields:', { 
        finalClientTransactionId, 
        finalPunchForce,
        receivedData: punchData 
      })
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: session_id/clientTransactionId and force_kg/punchForce'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client for database updates
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // **CRITICAL FIX: Save punch force to database**
    console.log(`Updating database with punch force: ${finalPunchForce}kg for transaction: ${finalClientTransactionId}`)
    
    const { data: updateData, error: updateError } = await supabase
      .from('transactions')
      .update({ 
        punch_force: finalPunchForce,
        updated_at: new Date().toISOString()
      })
      .eq('client_transaction_id', finalClientTransactionId)
      .select()

    if (updateError) {
      console.error('Failed to update transaction with punch force:', updateError)
      return new Response(
        JSON.stringify({
          success: false,
          error: `Database update failed: ${updateError.message}`,
          clientTransactionId: finalClientTransactionId,
          punchForce: finalPunchForce
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Database updated successfully:', updateData)

    // Broadcast the punch results to the connected clients
    const channelName = `punch-results-${finalClientTransactionId}`
    
    await supabase.channel(channelName).send({
      type: 'broadcast',
      event: 'punch_completed',
      payload: {
        clientTransactionId: finalClientTransactionId,
        punchForce: finalPunchForce,
        status,
        timestamp: timestamp || new Date().toISOString(),
        deviceId: finalDeviceId,
        source: 'raspberry_pi'
      }
    })

    console.log(`Broadcasted punch results for ${channelName}: ${finalPunchForce}kg`)

    // Also broadcast to a general punch machine channel for admin monitoring
    await supabase.channel('punch-machine-admin').send({
      type: 'broadcast',
      event: 'punch_recorded',
      payload: {
        clientTransactionId: finalClientTransactionId,
        punchForce: finalPunchForce,
        timestamp: timestamp || new Date().toISOString(),
        deviceId: finalDeviceId,
        status
      }
    })

    console.log('Admin notification sent for punch completion')

    // Return success response to the Pi
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Punch results received and processed successfully',
        clientTransactionId: finalClientTransactionId,
        punchForce: finalPunchForce,
        timestamp: new Date().toISOString(),
        databaseUpdated: true
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
