
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StatusRequest {
  checkoutId: string
  isTestMode: boolean
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { checkoutId, isTestMode = true }: StatusRequest = await req.json()

    const apiKey = isTestMode 
      ? Deno.env.get('SUMUP_TEST_API_KEY')
      : Deno.env.get('SUMUP_LIVE_API_KEY')
    
    const merchantCode = isTestMode
      ? Deno.env.get('SUMUP_TEST_MERCHANT_ID')
      : Deno.env.get('SUMUP_LIVE_MERCHANT_ID')

    if (!apiKey || !merchantCode) {
      throw new Error('SumUp credentials not configured')
    }

    console.log(`Checking status for checkout ID: ${checkoutId}`)

    // Fetch recent transactions and look for our transaction
    const recentUrl = `https://api.sumup.com/v2.1/merchants/${merchantCode}/transactions?limit=50`
    console.log(`Fetching recent transactions from: ${recentUrl}`)
    
    const recentResponse = await fetch(recentUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }
    })
    
    console.log(`Recent transactions response status: ${recentResponse.status}`)

    if (recentResponse.ok) {
      const recentData = await recentResponse.json()
      console.log(`Found ${recentData.items?.length || 0} recent transactions`)
      
      // Look for our transaction by client_transaction_id
      const foundTransaction = recentData.items?.find((t: any) => 
        t.client_transaction_id === checkoutId
      )
      
      if (foundTransaction) {
        console.log('Found transaction:', JSON.stringify(foundTransaction, null, 2))
        
        let status = 'PENDING'
        
        // Check both status and simple_status fields
        if (foundTransaction.status === 'SUCCESSFUL' || foundTransaction.simple_status === 'SUCCESSFUL') {
          status = 'PAID'
        } else if (foundTransaction.status === 'FAILED' || foundTransaction.status === 'CANCELLED' ||
                  foundTransaction.simple_status === 'FAILED' || foundTransaction.simple_status === 'CANCELLED') {
          status = 'FAILED'
        }

        return new Response(
          JSON.stringify({
            success: true,
            status: status,
            amount: foundTransaction.amount,
            currency: foundTransaction.currency,
            transactionId: foundTransaction.id,
            transactionCode: foundTransaction.transaction_code,
            date: foundTransaction.timestamp,
            rawResponse: foundTransaction
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      } else {
        console.log(`No transaction found with client_transaction_id: ${checkoutId}`)
        
        // Log all client_transaction_ids for debugging
        if (recentData.items?.length > 0) {
          console.log('Available client_transaction_ids:', 
            recentData.items.map((t: any) => t.client_transaction_id).filter(Boolean)
          )
        }
        
        // Transaction not found - likely still processing
        return new Response(
          JSON.stringify({
            success: true,
            status: 'PENDING',
            message: 'Transaction not found - may still be processing'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    } else {
      const errorText = await recentResponse.text()
      console.error(`Recent transactions API Error: ${recentResponse.status} - ${errorText}`)
      
      // If we get an error, return PENDING status
      return new Response(
        JSON.stringify({
          success: true,
          status: 'PENDING',
          message: `API returned ${recentResponse.status} - transaction may still be processing`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Status check error:', error)
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
