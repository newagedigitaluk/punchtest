
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
    
    const merchantCode = isTestMode
      ? Deno.env.get('SUMUP_TEST_MERCHANT_ID')
      : Deno.env.get('SUMUP_LIVE_MERCHANT_ID')

    if (!apiKey || !merchantCode) {
      throw new Error('SumUp API key or merchant code not configured')
    }

    if (action === 'list') {
      console.log('Fetching card readers list using correct API endpoint')
      
      const readersResponse = await fetch(`https://api.sumup.com/v0.1/merchants/${merchantCode}/readers`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      })

      if (!readersResponse.ok) {
        const errorData = await readersResponse.text()
        console.error('Readers API error:', errorData)
        throw new Error(`SumUp API error: ${readersResponse.status} - ${errorData}`)
      }

      const readersData = await readersResponse.json()
      console.log('Readers fetched successfully:', JSON.stringify(readersData))
      
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
      
      const pairResponse = await fetch(`https://api.sumup.com/v0.1/merchants/${merchantCode}/readers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pairing_code: pairingCode,
          name: `Reader-${pairingCode}`
        })
      })

      if (!pairResponse.ok) {
        const errorData = await pairResponse.text()
        console.error('Pairing error:', errorData)
        throw new Error(`Pairing failed: ${pairResponse.status} - ${errorData}`)
      }

      const pairData = await pairResponse.json()
      console.log('Reader paired successfully:', JSON.stringify(pairData))
      
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
      
      const unpairResponse = await fetch(`https://api.sumup.com/v0.1/merchants/${merchantCode}/readers/${readerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      })

      if (!unpairResponse.ok) {
        const errorData = await unpairResponse.text()
        console.error('Unpair error:', errorData)
        throw new Error(`Unpair failed: ${unpairResponse.status} - ${errorData}`)
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
