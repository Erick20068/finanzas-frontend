// backend/routes/asesor.js

import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const consultarAsesor = async (req, res) => {
  try {
    const { prompt, contexto, historial = [] } = req.body;

    const systemMessage = `
      Eres un asesor financiero personal experto, empático pero directo. 
      Tu objetivo es dar consejos financieros altamente personalizados basados en los datos reales del usuario.
      
      INFORMACIÓN DEL USUARIO ESTE MES:
      - Ingresos totales: $${contexto.ingresos}
      - Gastos totales: $${contexto.gastos}
      - Balance actual: $${contexto.ingresos - contexto.gastos}
      
      PRESUPUESTOS Y LÍMITES:
      ${JSON.stringify(contexto.presupuestos)}
      
      DEUDAS Y VENCIMIENTOS:
      ${JSON.stringify(contexto.deudas)}

      REGLAS DE RESPUESTA:
      1. Si el usuario pregunta por análisis, revisa si está excediendo sus presupuestos y adviértele.
      2. Si tiene deudas pendientes con estado "PENDIENTE", recuérdale que debe pagarlas.
      3. Da máximo 3 consejos claros, cortos y accionables.
      4. Usa un tono amigable pero profesional. No uses formatos de texto extraños, responde en texto claro.
    `;

    const mensajesParaLaIA = [
      { role: "system", content: systemMessage }, 
      ...historial,                              
      { role: "user", content: prompt }         
    ];

    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192", 
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt }
      ],
      temperature: 0.7, 
      max_tokens: 2048,
    });

    res.json({ respuesta: completion.choices[0]?.message?.content });

  } catch (error) {
    console.error("Error con Groq:", error);
    res.status(500).json({ error: "Error al consultar la IA" });
  }
};