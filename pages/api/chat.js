export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { question, systemPrompt } = req.body
  if (!question) return res.status(400).json({ error: 'Question required' })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: question }],
      }),
    })

    const data = await response.json()
    const answer = data.content?.[0]?.text || 'No response generated.'
    res.status(200).json({ answer })
  } catch (err) {
    console.error('Chat error:', err)
    res.status(500).json({ error: 'Failed to generate response' })
  }
}
