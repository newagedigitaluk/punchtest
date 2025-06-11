
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
    const { transactionId, amount, reason } = await req.json()
    
    console.log('Processing refund request:', { transactionId, amount, reason })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get transaction details
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (fetchError || !transaction) {
      throw new Error('Transaction not found')
    }

    if (!transaction.sumup_transaction_id) {
      throw new Error('No SumUp transaction ID found')
    }

    // Get SumUp API credentials
    const sumupApiKey = Deno.env.get('SUMUP_TEST_API_KEY') || Deno.env.get('SUMUP_LIVE_API_KEY')
    
    if (!sumupApiKey) {
      throw new Error('SumUp API key not configured')
    }

    // Call SumUp refund API
    const refundResponse = await fetch(`https://api.sumup.com/v0.1/me/refund/${transaction.sumup_transaction_id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sumupApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amount,
        reason: reason || 'Customer request'
      })
    })

    const refundData = await refundResponse.json()
    console.log('SumUp refund response:', refundData)

    if (!refundResponse.ok) {
      throw new Error(refundData.message || 'Refund request failed')
    }

    // Store refund record in database
    const { error: refundInsertError } = await supabase
      .from('refunds')
      .insert({
        transaction_id: transactionId,
        refund_id: refundData.transaction_id || refundData.id,
        amount: amount,
        reason: reason,
        status: 'successful',
        processed_by: 'admin'
      })

    if (refundInsertError) {
      console.error('Error storing refund record:', refundInsertError)
    }

    // Update transaction status
    const newRefundAmount = (transaction.refund_amount || 0) + amount
    const newStatus = newRefundAmount >= transaction.amount ? 'refunded' : 'partially_refunded'

    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        refund_amount: newRefundAmount,
        status: newStatus,
        refund_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId)

    if (updateError) {
      console.error('Error updating transaction:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        refund: refundData,
        message: 'Refund processed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Refund processing error:', error)
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
