import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting NCAA data sync...')

    // Current season: 2025-26 (started October 2025)
    const currentSeason = '2025/10'
    
    // Fetch current season standings with season parameter
    console.log(`Fetching standings for ${currentSeason} season...`)
    const standingsResponse = await fetch(`https://ncaa-api.henrygd.me/standings/basketball-men/d1/${currentSeason}`)
    
    if (!standingsResponse.ok) {
      throw new Error(`Failed to fetch standings: ${standingsResponse.status}`)
    }
    
    const standingsData = await standingsResponse.json()
    console.log('Standings data received, processing teams...')

    // Update team records from standings
    let teamsUpdated = 0
    const conferences = standingsData.conferences || []
    
    for (const conference of conferences) {
      const teams = conference.teams || conference.standings || []
      
      for (const team of teams) {
        const teamName = team.school || team.name
        const wins = team.wins || team.overall?.wins || 0
        const losses = team.losses || team.overall?.losses || 0
        
        if (teamName) {
          const { error } = await supabaseClient
            .from('teams')
            .update({
              wins,
              losses,
            })
            .ilike('name', teamName)
          
          if (!error) {
            teamsUpdated++
            console.log(`Updated ${teamName}: ${wins}-${losses}`)
          }
        }
      }
    }

    console.log(`Updated ${teamsUpdated} teams from standings`)

    // Fetch AP Poll rankings
    console.log('Fetching AP Poll rankings...')
    const apPollResponse = await fetch('https://ncaa-api.henrygd.me/rankings/basketball-men/d1/associated-press')
    
    if (!apPollResponse.ok) {
      throw new Error(`Failed to fetch AP Poll: ${apPollResponse.status}`)
    }
    
    const apPollData = await apPollResponse.json()
    console.log('AP Poll data received, processing rankings...')

    // First, clear all existing AP rankings
    await supabaseClient
      .from('teams')
      .update({ ap_rank: null, ap_points: 0 })
      .not('ap_rank', 'is', null)

    // Update AP Poll rankings
    let apTeamsUpdated = 0
    const rankings = apPollData.rankings || apPollData.teams || []
    
    for (const ranking of rankings) {
      const teamName = ranking.school || ranking.team || ranking.name
      const rank = ranking.rank || ranking.ranking
      const points = ranking.points || ranking.total_points || 0
      
      if (teamName && rank) {
        // Try multiple matching strategies
        const namesToTry = [
          teamName,
          teamName.replace(/^(U|Univ\.|University) of /, ''),
          teamName.replace(/ State$/, ' St.'),
          teamName.replace(/ St\.$/, ' State'),
        ]
        
        for (const nameToTry of namesToTry) {
          const { data: matchedTeams, error } = await supabaseClient
            .from('teams')
            .select('id, name')
            .ilike('name', `%${nameToTry}%`)
            .limit(1)
          
          if (matchedTeams && matchedTeams.length > 0) {
            const { error: updateError } = await supabaseClient
              .from('teams')
              .update({
                ap_rank: rank,
                ap_points: points,
              })
              .eq('id', matchedTeams[0].id)
            
            if (!updateError) {
              apTeamsUpdated++
              console.log(`Updated AP ranking: #${rank} ${matchedTeams[0].name} (${points} points)`)
              break
            }
          }
        }
      }
    }

    console.log(`Updated ${apTeamsUpdated} teams with AP rankings`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'NCAA data sync completed',
        stats: {
          teamsUpdated,
          apTeamsUpdated,
          season: currentSeason,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error syncing NCAA data:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})