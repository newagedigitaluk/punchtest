
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
        merchant_code,
        amount,
        currency = 'GBP',
        payment_type
      }
    } = webhookData

    console.log(`Webhook received for transaction ${client_transaction_id}: ${status}`)

    // Initialize Supabase client for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Store or update transaction in database
    const { data: existingTransaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('client_transaction_id', client_transaction_id)
      .single()

    if (existingTransaction) {
      // Update existing transaction
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          sumup_transaction_id: transaction_id,
          status: status,
          payment_method: payment_type,
          updated_at: new Date().toISOString()
        })
        .eq('client_transaction_id', client_transaction_id)

      if (updateError) {
        console.error('Error updating transaction:', updateError)
      } else {
        console.log('Transaction updated successfully')
      }
    } else {
      // Insert new transaction
      const { error: insertError } = await supabase
        .from('transactions')
        .insert({
          client_transaction_id,
          sumup_transaction_id: transaction_id,
          amount: amount || 1.00,
          currency: currency,
          status: status,
          merchant_code: merchant_code,
          payment_method: payment_type
        })

      if (insertError) {
        console.error('Error inserting transaction:', insertError)
      } else {
        console.log('Transaction stored successfully')
      }
    }

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

    // If payment was successful, trigger the punch machine
    if (status === 'successful') {
      console.log('Payment successful - triggering punch machine')
      
      const punchMachineUrl = 'https://cunning-burro-similarly.ngrok-free.app'
      
      try {
        const triggerResponse = await supabase.functions.invoke('punch-trigger', {
          body: {
            clientTransactionId: client_transaction_id,
            punchMachineUrl: punchMachineUrl
          }
        })

        if (triggerResponse.error) {
          console.error('Failed to trigger punch machine:', triggerResponse.error)
        } else {
          console.log('Punch machine triggered successfully:', triggerResponse.data)
        }
      } catch (triggerError) {
        console.error('Error triggering punch machine:', triggerError)
      }
    }

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
