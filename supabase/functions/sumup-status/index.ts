
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

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }

    // Try to get recent transactions first - this is more reliable for card reader payments
    console.log('Fetching recent transactions to find completed payment')
    
    const recentUrl = `https://api.sumup.com/v0.1/me/transactions?limit=20`
    console.log(`Fetching recent transactions from: ${recentUrl}`)
    
    const recentResponse = await fetch(recentUrl, { headers })
    
    console.log(`Recent transactions response status: ${recentResponse.status}`)

    if (recentResponse.ok) {
      const recentData = await recentResponse.json()
      console.log(`Found ${recentData.length || 0} recent transactions`)
      
      // Look for our transaction by client_transaction_id or transaction_id
      let foundTransaction = null
      
      if (Array.isArray(recentData)) {
        foundTransaction = recentData.find((t: any) => 
          t.client_transaction_id === checkoutId || 
          t.id === checkoutId ||
          t.transaction_id === checkoutId
        )
      } else if (recentData.items && Array.isArray(recentData.items)) {
        foundTransaction = recentData.items.find((t: any) => 
          t.client_transaction_id === checkoutId || 
          t.id === checkoutId ||
          t.transaction_id === checkoutId
        )
      }
      
      if (foundTransaction) {
        console.log('Found transaction in recent list:', JSON.stringify(foundTransaction, null, 2))
        
        let status = 'PENDING'
        
        // Check various status fields
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
            date: foundTransaction.timestamp || foundTransaction.date,
            endpoint_used: 'recent_transactions_search',
            rawResponse: foundTransaction
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // If recent transactions didn't work, try direct endpoints
    const endpointsToTry = [
      `https://api.sumup.com/v0.1/me/transactions/${checkoutId}`,
      `https://api.sumup.com/v0.1/merchants/${merchantCode}/transactions/${checkoutId}`,
      `https://api.sumup.com/v0.1/merchants/${merchantCode}/checkouts/${checkoutId}`
    ]

    for (const endpoint of endpointsToTry) {
      console.log(`Trying endpoint: ${endpoint}`)
      
      try {
        const response = await fetch(endpoint, {
          headers,
          method: 'GET'
        })

        console.log(`Response from ${endpoint}: ${response.status}`)

        if (response.ok) {
          const transactionData = await response.json()
          console.log(`Found transaction data:`, JSON.stringify(transactionData, null, 2))
          
          let status = 'PENDING'
          const statusFields = ['status', 'transaction_status', 'payment_status', 'state', 'simple_status']
          
          for (const statusField of statusFields) {
            if (transactionData[statusField]) {
              const foundStatus = transactionData[statusField]
              console.log(`Found status field '${statusField}' with value: ${foundStatus}`)
              
              if (foundStatus === 'SUCCESSFUL' || foundStatus === 'PAID') {
                status = 'PAID'
              } else if (foundStatus === 'FAILED' || foundStatus === 'CANCELLED') {
                status = 'FAILED'
              }
              break
            }
          }

          return new Response(
            JSON.stringify({
              success: true,
              status: status,
              amount: transactionData.amount,
              currency: transactionData.currency,
              transactionId: transactionData.id,
              transactionCode: transactionData.transaction_code,
              date: transactionData.timestamp || transactionData.date,
              endpoint_used: endpoint,
              rawResponse: transactionData
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        } else {
          const errorText = await response.text()
          console.log(`Error from ${endpoint}: ${response.status} - ${errorText}`)
        }
      } catch (endpointError) {
        console.log(`Exception with endpoint ${endpoint}:`, endpointError)
      }
    }

    // If we get here, transaction not found anywhere
    console.log(`Transaction ${checkoutId} not found in any endpoint`)
    
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
