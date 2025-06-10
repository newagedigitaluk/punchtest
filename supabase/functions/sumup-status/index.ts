
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

    // Try multiple endpoints to find the transaction
    const endpoints = [
      // Try the me/transactions endpoint first (more reliable for recent transactions)
      `https://api.sumup.com/v0.1/me/transactions/${checkoutId}`,
      // Try the checkout endpoint
      `https://api.sumup.com/v0.1/checkouts/${checkoutId}`,
      // Try the merchant transactions endpoint
      `https://api.sumup.com/v0.1/merchants/${merchantCode}/transactions/${checkoutId}`,
    ]

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`)
        
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          }
        })

        console.log(`Response status from ${endpoint}: ${response.status}`)

        if (response.ok) {
          const data = await response.json()
          console.log(`Success from ${endpoint}:`, JSON.stringify(data))
          
          // Normalize the response structure
          let status = 'PENDING'
          let transactionData = data

          // Handle different response structures
          if (data.data) {
            transactionData = data.data
          }

          // Check various status fields
          const statusField = transactionData.status || transactionData.transaction_status || transactionData.state
          
          if (statusField === 'SUCCESSFUL' || statusField === 'PAID' || statusField === 'successful' || statusField === 'paid') {
            status = 'PAID'
          } else if (statusField === 'FAILED' || statusField === 'CANCELLED' || statusField === 'failed' || statusField === 'cancelled') {
            status = 'FAILED'
          }

          return new Response(
            JSON.stringify({
              success: true,
              status: status,
              amount: transactionData.amount || transactionData.total_amount?.value,
              currency: transactionData.currency || transactionData.total_amount?.currency,
              transactionId: transactionData.transaction_id || transactionData.id || checkoutId,
              transactionCode: transactionData.transaction_code || transactionData.code,
              date: transactionData.date || transactionData.created_at || transactionData.timestamp,
              rawResponse: transactionData,
              endpoint: endpoint
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        } else {
          const errorText = await response.text()
          console.log(`Failed endpoint ${endpoint}: ${response.status} - ${errorText}`)
        }
      } catch (error) {
        console.log(`Error with endpoint ${endpoint}:`, error.message)
      }
    }

    // If we can't find the transaction anywhere, try listing recent transactions
    try {
      console.log('Trying to list recent transactions to find our payment')
      
      const listResponse = await fetch(`https://api.sumup.com/v0.1/me/transactions?limit=50`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      })

      if (listResponse.ok) {
        const listData = await listResponse.json()
        console.log('Recent transactions:', JSON.stringify(listData))
        
        // Look for our transaction in the list
        const transactions = listData.items || listData.data || []
        const transaction = transactions.find((t: any) => 
          t.client_transaction_id === checkoutId ||
          t.transaction_id === checkoutId ||
          t.id === checkoutId ||
          t.transaction_code === checkoutId
        )

        if (transaction) {
          console.log('Found matching transaction in list:', transaction)
          
          let status = 'PENDING'
          const statusField = transaction.status || transaction.transaction_status || transaction.state
          
          if (statusField === 'SUCCESSFUL' || statusField === 'PAID' || statusField === 'successful' || statusField === 'paid') {
            status = 'PAID'
          } else if (statusField === 'FAILED' || statusField === 'CANCELLED' || statusField === 'failed' || statusField === 'cancelled') {
            status = 'FAILED'
          }

          return new Response(
            JSON.stringify({
              success: true,
              status: status,
              amount: transaction.amount || transaction.total_amount?.value,
              currency: transaction.currency || transaction.total_amount?.currency,
              transactionId: transaction.transaction_id || transaction.id,
              transactionCode: transaction.transaction_code,
              date: transaction.date || transaction.created_at || transaction.timestamp,
              rawResponse: transaction,
              foundInList: true
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
      } else {
        console.log(`Failed to list transactions: ${listResponse.status}`)
      }
    } catch (error) {
      console.error('Error listing transactions:', error)
    }
    
    // If we still can't find the transaction, return PENDING status
    console.log('Transaction not found, returning PENDING status')
    return new Response(
      JSON.stringify({
        success: true,
        status: 'PENDING',
        message: 'Transaction not found in SumUp API - may still be processing'
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
