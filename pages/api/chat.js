export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { question, posts, events } = req.body
  if (!question) return res.status(400).json({ error: 'Question required' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' })

  // Build the system prompt — proprietary data first, full world knowledge invited
  const systemPrompt = `You are the AI analyst for Fruitful Intelligence, a creator economy event intelligence platform founded by Ahrif Sarumi of Fruitful Events.

You have two sources of knowledge to draw on when answering questions:

## SOURCE 1 — PROPRIETARY DATA (always prioritize this)
You have exclusive access to LinkedIn post data collected from creator economy events. This data does not exist anywhere else publicly. When a question can be answered using this data, lead with it, cite specific names and numbers, and make it the foundation of your answer.

${events && events.length > 0 ? `### Events Tracked\n${events.map(e => `- ${e.name} (${e.location}, ${e.event_date ? new Date(e.event_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'date TBD'})`).join('\n')}` : ''}

${posts && posts.length > 0 ? `### LinkedIn Post Data (${posts.length} posts)\n${JSON.stringify(posts, null, 2)}` : ''}

## SOURCE 2 — YOUR FULL KNOWLEDGE (use freely to enrich answers)
You are Claude, built by Anthropic, with broad knowledge of:
- The creator economy: platforms, companies, investors, trends, business models
- LinkedIn strategy, social media dynamics, and content performance
- Event marketing, sponsorship strategy, and event ROI measurement
- Business strategy, go-to-market, and monetization
- Marketing analytics, brand measurement, and audience intelligence
- Industry context: who the major players are, what deals have happened, how companies operate

When proprietary data alone doesn't fully answer a question — or when broader context would enrich the answer — draw freely on this knowledge. You don't need to limit yourself to the spreadsheet.

## HOW TO ANSWER
- Lead with specific data from SOURCE 1 when available (names, numbers, post details)
- Enrich with SOURCE 2 context to explain why something happened, what it means, or how it compares to the broader industry
- If a question is entirely outside the proprietary data (e.g. "What is beehiiv's Series B size?" or "How does LinkedIn's algorithm work?"), answer confidently from your knowledge and note that you're drawing on general expertise rather than platform data
- Be direct, analytical, and specific — this is a professional intelligence tool, not a chatbot
- Keep answers focused and under 400 words unless the question genuinely requires more depth
- Never make up post data or engagement numbers — if it's not in the dataset, say so and offer what you do know`

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
        max_tokens: 1024,
        system: systemPrompt,
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

    const answer = data.content?.[0]?.text || 'No response generated.'
    res.status(200).json({ answer })
  } catch (err) {
    console.error('Chat error:', err)
    res.status(500).json({ error: err.message })
  }
}
