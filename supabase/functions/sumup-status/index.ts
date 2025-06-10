
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

    // For Reader API transactions, we need to check transactions, not checkouts
    // Try multiple endpoints as the exact endpoint for Reader transaction status may vary
    const endpoints = [
      `https://api.sumup.com/v0.1/me/transactions/${checkoutId}`,
      `https://api.sumup.com/v0.1/merchants/${merchantCode}/transactions/${checkoutId}`,
      `https://api.sumup.com/v0.1/checkouts/${checkoutId}` // Fallback for online checkouts
    ]

    let lastError = null
    
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
          let transactionId = null
          let transactionCode = null
          let amount = null
          let currency = null
          let date = null

          // Handle different response structures
          if (statusData.status) {
            // Direct status field
            status = statusData.status
          } else if (statusData.transaction_status) {
            // Alternative status field name
            status = statusData.transaction_status
          } else if (statusData.payment_type) {
            // Some endpoints might have payment_type instead
            status = statusData.payment_type === 'CARD' ? 'PAID' : 'PENDING'
          }

          // Extract other fields
          transactionId = statusData.transaction_id || statusData.id || checkoutId
          transactionCode = statusData.transaction_code || statusData.code
          amount = statusData.amount || statusData.total_amount?.value
          currency = statusData.currency || statusData.total_amount?.currency
          date = statusData.date || statusData.created_at || statusData.timestamp

          // Convert amount from minor units if needed
          if (amount && typeof amount === 'number' && amount > 100) {
            amount = amount / 100 // Convert from minor units
          }

          return new Response(
            JSON.stringify({
              success: true,
              status: status,
              amount: amount,
              currency: currency,
              transactionId: transactionId,
              transactionCode: transactionCode,
              date: date,
              rawResponse: statusData
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        } else {
          lastError = `${endpoint}: ${statusResponse.status}`
          console.log(`Failed endpoint ${endpoint}: ${statusResponse.status}`)
        }
      } catch (error) {
        lastError = `${endpoint}: ${error.message}`
        console.log(`Error with endpoint ${endpoint}:`, error.message)
      }
    }

    // If all endpoints failed, return the last error
    throw new Error(`All status check endpoints failed. Last error: ${lastError}`)

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
