
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
    console.log('SumUp webhook received:', req.method)
    
    // Parse the webhook payload
    const webhookData = await req.json()
    console.log('Webhook payload:', JSON.stringify(webhookData, null, 2))

    // Extract payment information from the webhook - SumUp sends status in payload
    const { 
      id: eventId,
      event_type,
      payload: {
        client_transaction_id,
        status,
        transaction_id,
        merchant_code
      }
    } = webhookData

    console.log(`Webhook received for transaction ${client_transaction_id}: ${status}`)

    // Initialize Supabase client for real-time updates
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Broadcast the payment status update to all connected clients
    const channelName = `payment-${client_transaction_id}`
    
    await supabase.channel(channelName).send({
      type: 'broadcast',
      event: 'payment_update',
      payload: {
        transactionId: transaction_id,
        clientTransactionId: client_transaction_id,
        status: status,
        eventType: event_type,
        timestamp: new Date().toISOString(),
        source: 'webhook'
      }
    })

    console.log(`Broadcasted payment update for ${channelName}:`, status)

    // Return success response to SumUp
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed successfully',
        clientTransactionId: client_transaction_id,
        status: status
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
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
