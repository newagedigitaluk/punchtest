
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

    // For Reader API transactions, we need to check the merchant's transaction history
    // The checkoutId we have is the client_transaction_id from the Reader API
    
    try {
      console.log('Fetching merchant transactions to find our payment')
      
      const transactionsResponse = await fetch(`https://api.sumup.com/v0.1/merchants/${merchantCode}/transactions`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      })

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json()
        console.log('Fetched transactions:', transactionsData)
        
        // Look for our transaction in the recent transactions
        // The checkoutId we're looking for might be in various fields
        const transaction = transactionsData.data?.find((t: any) => 
          t.client_transaction_id === checkoutId ||
          t.transaction_id === checkoutId ||
          t.id === checkoutId ||
          t.transaction_code === checkoutId
        )

        if (transaction) {
          console.log('Found matching transaction:', transaction)
          
          // Normalize the status
          let status = 'PENDING'
          if (transaction.status === 'SUCCESSFUL' || transaction.status === 'PAID') {
            status = 'PAID'
          } else if (transaction.status === 'FAILED' || transaction.status === 'CANCELLED') {
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
              rawResponse: transaction
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        } else {
          console.log('Transaction not found in recent transactions, checking individual endpoints')
          
          // Fall back to trying individual transaction endpoints
          const endpoints = [
            `https://api.sumup.com/v0.1/me/transactions/${checkoutId}`,
            `https://api.sumup.com/v0.1/merchants/${merchantCode}/transactions/${checkoutId}`,
            `https://api.sumup.com/v0.1/checkouts/${checkoutId}`
          ]

          for (const endpoint of endpoints) {
            try {
              console.log(`Trying endpoint: ${endpoint}`)
              
              const statusResponse = await fetch(endpoint, {
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                }
              })

              if (statusResponse.ok) {
                const statusData = await statusResponse.json()
                console.log(`Success from ${endpoint}:`, statusData)
                
                // Normalize the response structure
                let status = 'PENDING'
                if (statusData.status === 'SUCCESSFUL' || statusData.status === 'PAID') {
                  status = 'PAID'
                } else if (statusData.status === 'FAILED' || statusData.status === 'CANCELLED') {
                  status = 'FAILED'
                }

                return new Response(
                  JSON.stringify({
                    success: true,
                    status: status,
                    amount: statusData.amount || statusData.total_amount?.value,
                    currency: statusData.currency || statusData.total_amount?.currency,
                    transactionId: statusData.transaction_id || statusData.id || checkoutId,
                    transactionCode: statusData.transaction_code || statusData.code,
                    date: statusData.date || statusData.created_at || statusData.timestamp,
                    rawResponse: statusData
                  }),
                  {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                  }
                )
              } else {
                console.log(`Failed endpoint ${endpoint}: ${statusResponse.status}`)
              }
            } catch (error) {
              console.log(`Error with endpoint ${endpoint}:`, error.message)
            }
          }
          
          // If we can't find the transaction anywhere, it might still be processing
          console.log('Transaction not found, returning PENDING status')
          return new Response(
            JSON.stringify({
              success: true,
              status: 'PENDING',
              message: 'Transaction not found in recent transactions - may still be processing'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
      } else {
        throw new Error(`Failed to fetch transactions: ${transactionsResponse.status}`)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      throw error
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
