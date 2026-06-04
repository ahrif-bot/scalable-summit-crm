export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { question, posts, events } = req.body
  if (!question) return res.status(400).json({ error: 'Question required' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' })

  const systemPrompt = `You are the AI analyst for Fruitful Intelligence, a creator economy event intelligence platform founded by Ahrif Sarumi of Fruitful Events.

You have three sources of knowledge to draw on:

## SOURCE 1 — PROPRIETARY DATA (always prioritize this)
You have exclusive access to LinkedIn post data collected from creator economy events. This data does not exist anywhere else publicly. When a question can be answered using this data, lead with it, cite specific names and numbers, and make it the foundation of your answer.

${events && events.length > 0 ? `### Events Tracked\n${events.map(e => `- ${e.name} (${e.location || ''}, ${e.event_date ? new Date(e.event_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'date TBD'})`).join('\n')}` : ''}

${posts && posts.length > 0 ? `### LinkedIn Post Data (${posts.length} posts)\n${JSON.stringify(posts, null, 2)}` : ''}

## SOURCE 2 — WEB SEARCH (use when you need current or verified information)
You have access to a web search tool. Use it when:
- A question involves recent news, company details, funding rounds, or current events
- You are not confident about a specific fact (company name, acquisition details, product features)
- A user asks about something that may have changed since your training
- You want to verify something before stating it confidently
Always search before answering questions about specific companies, people, or recent events in the creator economy.

## SOURCE 3 — YOUR FULL KNOWLEDGE (use freely to enrich answers)
You are Claude, built by Anthropic, with broad knowledge of the creator economy, LinkedIn strategy, event marketing, sponsorship ROI, business strategy, and marketing analytics. Draw on this freely to contextualize and enrich your answers.

## HOW TO ANSWER
- Lead with SOURCE 1 data when available — names, numbers, post details
- Search the web (SOURCE 2) when you need to verify facts or get current information — do this before answering, not after
- Enrich with SOURCE 3 context to explain why something happened or what it means
- Be direct, analytical, and specific — this is a professional intelligence tool
- Keep answers focused and under 500 words unless depth is genuinely needed
- Never make up post data or engagement numbers — if it's not in the dataset, say so
- When you use web search results, cite what you found naturally in your answer`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1500,
        system: systemPrompt,
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search',
          }
        ],
        messages: [{ role: 'user', content: question }],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(500).json({
        error: 'Anthropic API error',
        status: response.status,
        details: data
      })
    }

    // Extract all text blocks from the response
    // Claude may return multiple content blocks including tool use and tool results
    const textBlocks = data.content
      ?.filter(block => block.type === 'text')
      ?.map(block => block.text)
      ?.join('\n\n')

    const answer = textBlocks || 'No response generated.'
    res.status(200).json({ answer })
  } catch (err) {
    console.error('Chat error:', err)
    res.status(500).json({ error: err.message })
  }
}
