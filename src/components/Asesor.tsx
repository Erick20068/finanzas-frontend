import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

interface Mensaje {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ResumenFinanciero {
  ingresos: number;
  gastos: number;
  presupuestos: any[];
  deudas: any[];
}

export default function Asesor() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { 
      role: 'system', 
      content: 'Puedo leer tus movimientos del mes y devolverte tres recomendaciones concretas. Pulsa Analizar mis finanzas o escribe una pregunta.' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [resumen, setResumen] = useState<ResumenFinanciero>({ 
    ingresos: 0, 
    gastos: 0,
    presupuestos: [],
    deudas: []
  });

  // Cargar todos los datos reales del usuario desde Supabase
  useEffect(() => {
    const fetchContextoTotal = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const inicioMes = '2026-09-01';
      const finMes = '2026-09-30';

      // 1. Traer Transacciones para calcular ingresos y gastos del mes
      const { data: trans } = await supabase
        .from('transacciones')
        .select('tipo_transaccion, monto')
        .eq('usuario_id', user.id)
        .gte('fecha_movimiento', inicioMes)
        .lte('fecha_movimiento', finMes);

      // 2. Traer Presupuestos (unidos con el nombre de la categoría)
      const { data: presups } = await supabase
        .from('presupuestos')
        .select('monto_limite, categorias(nombre)')
        .eq('usuario_id', user.id)
        .eq('mes', 9);

      // 3. Traer Deudas pendientes
      const { data: deudas } = await supabase
        .from('deudas')
        .select('entidad_persona, monto_total, estado, fecha_vencimiento')
        .eq('usuario_id', user.id)
        .eq('estado', 'PENDIENTE');

      let ingresos = 0;
      let gastos = 0;
      
      if (trans) {
        ingresos = trans.filter(t => t.tipo_transaccion === 'INGRESO').reduce((a, b) => a + Number(b.monto), 0);
        gastos = trans.filter(t => t.tipo_transaccion === 'GASTO').reduce((a, b) => a + Number(b.monto), 0);
      }

      setResumen({ 
        ingresos, 
        gastos,
        presupuestos: presups || [],
        deudas: deudas || []
      });
    };

    fetchContextoTotal();
  }, []);

  const enviarMensaje = async (e?: React.FormEvent, isAnalisis = false) => {
    e?.preventDefault();
    if (!input.trim() && !isAnalisis) return;
    
    // Si presiona el botón, enviamos un prompt predefinido
    const textoUsuario = isAnalisis 
      ? "Analizar mis finanzas del mes y dame 3 recomendaciones concretas." 
      : input;
    
    // Agregamos el mensaje del usuario a la interfaz
    setMensajes(prev => [...prev, { role: 'user', content: textoUsuario }]);
    setInput('');
    setIsTyping(true);
    
    try {
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/asesor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: textoUsuario,
          contexto: resumen // Enviamos todos los datos recopilados de Supabase
        })
      });

      if (!response.ok) throw new Error('Error en la respuesta del servidor');

      const data = await response.json();

      // Agregamos la respuesta de la IA a la vista
      setMensajes(prev => [...prev, { 
        role: 'assistant', 
        content: data.respuesta 
      }]);

    } catch (error) {
      console.error(error);
      setMensajes(prev => [...prev, { 
        role: 'assistant', 
        content: 'Error de conexión con el servidor. Verifica que tu backend esté corriendo.' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const balance = resumen.ingresos - resumen.gastos;

  return (
    <div className="p-8 bg-[#0a0a0a] text-zinc-200 min-h-screen font-sans flex flex-col md:flex-row gap-8">
      
      {/* PANEL IZQUIERDO - Contexto */}
      <div className="w-full md:w-[400px] flex flex-col">
        <h1 className="text-3xl font-serif text-[#e4dec7] mb-2">Asesor</h1>
        <p className="text-zinc-500 mb-8 text-sm">
          Un análisis puntual de tus números del mes. No se llama solo: tú decides cuándo consultar.
        </p>

        <div className="bg-[#141414] rounded-2xl p-6 border border-zinc-800/50 mb-4">
          <p className="text-xs text-zinc-500 tracking-wider font-semibold mb-4">CONTEXTO DEL MES</p>
          <h2 className="text-xl font-serif text-[#e4dec7] mb-6">Septiembre de 2026</h2>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Ingresos</span>
              <span className="text-zinc-200">${resumen.ingresos.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Gastos</span>
              <span className="text-zinc-200">${resumen.gastos.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-zinc-400 pt-2 border-t border-zinc-800/50">
              <span>Balance</span>
              <span className={`font-medium ${balance >= 0 ? 'text-[#e4dec7]' : 'text-red-400'}`}>
                ${balance.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={(e) => enviarMensaje(e, true)}
          disabled={isTyping}
          className="w-full bg-[#e4dec7] hover:bg-[#d4ceb8] disabled:opacity-50 disabled:cursor-not-allowed text-zinc-900 font-medium py-3 rounded-xl flex justify-center items-center gap-2 mb-4 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          Analizar mis finanzas
        </button>

        <p className="text-zinc-600 text-xs leading-relaxed">
          El resumen se arma en el navegador (ingresos, categorías, presupuestos rotos y pagos vencidos) y se envía al asesor. La clave de la API nunca sale del servidor.
        </p>
      </div>

      {/* PANEL DERECHO - Chat */}
      <div className="flex-1 flex flex-col bg-[#111111] border border-zinc-800/50 rounded-2xl overflow-hidden h-[75vh]">
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
          {mensajes.map((msg, idx) => (
            <div key={idx} className={`max-w-[85%] p-4 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
              msg.role === 'system' ? 'bg-[#1a1a1a] text-zinc-400 self-center text-center border border-zinc-800/50 text-xs italic' :
              msg.role === 'user' ? 'bg-[#2a2a2a] text-zinc-200 self-end' :
              'bg-[#1a1a1a] text-zinc-300 self-start border border-zinc-800'
            }`}>
              {msg.content}
            </div>
          ))}
          
          {/* Indicador de escritura */}
          {isTyping && (
             <div className="bg-[#1a1a1a] text-zinc-500 self-start border border-zinc-800 p-4 rounded-2xl text-sm flex gap-2 items-center">
               <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
               <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
               <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
             </div>
          )}
        </div>
        
        {/* Input form */}
        <div className="p-4 bg-[#111111] border-t border-zinc-800/50">
          <form onSubmit={(e) => enviarMensaje(e, false)} className="relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              placeholder="Pregunta sobre ahorro, deudas o presupuesto..." 
              className="w-full bg-[#1a1a1a] border border-zinc-800 text-zinc-200 rounded-full py-3 px-6 pr-12 focus:outline-none focus:border-[#e4dec7]/50 disabled:opacity-50 text-sm transition-colors"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white disabled:opacity-50 disabled:hover:text-zinc-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}