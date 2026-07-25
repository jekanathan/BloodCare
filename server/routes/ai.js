const express = require('express');
const router  = require('express').Router();
const Groq    = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are BloodCare AI, an intelligent virtual healthcare assistant for the BloodCare Blood Bank and Donor Management System.
Only answer questions related to blood donation, blood groups, compatibility, eligibility, emergency requests, donor/hospital registration, and BloodCare platform features.
Donation Eligibility: Age 18-60, Weight 50kg+, Healthy, 4 months since last donation. Not eligible: sick, pregnant, recent surgery, infectious diseases.
Never diagnose diseases. Never invent blood stock data. Never answer unrelated questions — say: "I'm designed specifically to assist with BloodCare and blood donation related services."
Support English, Tamil, and Sinhala — auto-detect and respond in same language.
Be professional, helpful, empathetic, concise. Use emojis where appropriate.`;

router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content
      || "I'm sorry, I couldn't process that. Please try again.";

    res.json({ reply });

  } catch (err) {
    console.error('AI Error:', err.message);
    res.status(500).json({ error: 'AI service unavailable' });
  }
});

module.exports = router;