
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

    console.log(`Checking status for transaction: ${checkoutId}`)

    // Use the correct v2.1 API endpoint with client_transaction_id query parameter
    const apiUrl = `https://api.sumup.com/v2.1/merchants/${merchantCode}/transactions?client_transaction_id=${checkoutId}`
    
    console.log(`Using API endpoint: ${apiUrl}`)
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }
    })

    console.log(`Response status: ${response.status}`)

    if (response.ok) {
      const data = await response.json()
      console.log('Transaction data received:', JSON.stringify(data))
      
      // Check if we have transactions in the response
      if (data.items && data.items.length > 0) {
        const transaction = data.items[0] // Get the first (and should be only) transaction
        
        let status = 'PENDING'
        
        // Check the status field for the payment status
        if (transaction.status === 'SUCCESSFUL' || transaction.simple_status === 'SUCCESSFUL') {
          status = 'PAID'
        } else if (transaction.status === 'FAILED' || transaction.status === 'CANCELLED' || 
                  transaction.simple_status === 'FAILED' || transaction.simple_status === 'CANCELLED') {
          status = 'FAILED'
        }

        return new Response(
          JSON.stringify({
            success: true,
            status: status,
            amount: transaction.amount,
            currency: transaction.currency,
            transactionId: transaction.id,
            transactionCode: transaction.transaction_code,
            date: transaction.timestamp,
            rawResponse: transaction
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      } else {
        console.log('No transactions found for client_transaction_id:', checkoutId)
        
        // If no specific transaction found, try listing recent transactions to find it
        const recentUrl = `https://api.sumup.com/v2.1/merchants/${merchantCode}/transactions?limit=50`
        console.log('Fetching recent transactions from:', recentUrl)
        
        const recentResponse = await fetch(recentUrl, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          }
        })
        
        if (recentResponse.ok) {
          const recentData = await recentResponse.json()
          console.log(`Found ${recentData.items?.length || 0} recent transactions`)
          
          // Look for our transaction in recent transactions
          const foundTransaction = recentData.items?.find((t: any) => 
            t.id === checkoutId || 
            t.transaction_code === checkoutId ||
            t.internal_id?.toString() === checkoutId
          )
          
          if (foundTransaction) {
            console.log('Found transaction in recent list:', foundTransaction)
            
            let status = 'PENDING'
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
                rawResponse: foundTransaction,
                foundInRecentList: true
              }),
              {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }
        }
        
        // Transaction not found anywhere - likely still processing
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
      const errorText = await response.text()
      console.error(`API Error: ${response.status} - ${errorText}`)
      
      // If we get a 404 or other error, return PENDING status
      return new Response(
        JSON.stringify({
          success: true,
          status: 'PENDING',
          message: `API returned ${response.status} - transaction may still be processing`
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
