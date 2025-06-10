
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReadersRequest {
  isTestMode: boolean
  action: 'list' | 'pair' | 'unpair'
  pairingCode?: string
  readerId?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { isTestMode = true, action, pairingCode, readerId }: ReadersRequest = await req.json()

    const apiKey = isTestMode 
      ? Deno.env.get('SUMUP_TEST_API_KEY')
      : Deno.env.get('SUMUP_LIVE_API_KEY')
    
    const merchantId = isTestMode
      ? Deno.env.get('SUMUP_TEST_MERCHANT_ID')
      : Deno.env.get('SUMUP_LIVE_MERCHANT_ID')

    if (!apiKey || !merchantId) {
      throw new Error('SumUp API key or merchant ID not configured')
    }

    if (action === 'list') {
      console.log('Fetching card readers list')
      
      const readersResponse = await fetch(`https://api.sumup.com/v0.1/merchants/${merchantId}/readers`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      })

      if (!readersResponse.ok) {
        throw new Error(`SumUp API error: ${readersResponse.status}`)
      }

      const readersData = await readersResponse.json()
      
      return new Response(
        JSON.stringify({
          success: true,
          readers: readersData.items || []
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } else if (action === 'pair' && pairingCode) {
      console.log(`Pairing reader with code: ${pairingCode}`)
      
      const pairResponse = await fetch(`https://api.sumup.com/v0.1/merchants/${merchantId}/readers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pairing_code: pairingCode
        })
      })

      if (!pairResponse.ok) {
        const errorData = await pairResponse.text()
        console.error('Pairing error:', errorData)
        throw new Error(`Pairing failed: ${pairResponse.status}`)
      }

      const pairData = await pairResponse.json()
      
      return new Response(
        JSON.stringify({
          success: true,
          reader: pairData
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } else if (action === 'unpair' && readerId) {
      console.log(`Unpairing reader with ID: ${readerId}`)
      
      const unpairResponse = await fetch(`https://api.sumup.com/v0.1/merchants/${merchantId}/readers/${readerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      })

      if (!unpairResponse.ok) {
        const errorData = await unpairResponse.text()
        console.error('Unpair error:', errorData)
        throw new Error(`Unpair failed: ${unpairResponse.status}`)
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Reader unpaired successfully'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    throw new Error('Invalid action or missing required parameters')

  } catch (error) {
    console.error('Readers API error:', error)
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
