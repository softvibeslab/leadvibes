#!/bin/bash

echo "🧞 Configurando ROVI - Presentación Mágica..."
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Visita https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Instalar dependencias
echo ""
echo "📦 Instalando dependencias..."
npm install

# Crear directorio de logs si no existe
mkdir -p logs

echo ""
echo "✨ Setup completo!"
echo ""
echo "🚀 Para iniciar la presentación:"
echo "   npm run dev"
echo ""
echo "📁 Se abrirá automáticamente en http://localhost:3000"
echo ""
echo "🎮 Controles:"
echo "   ← →  : Navegar slides"
echo "   Espacio : Siguiente slide"
echo "   Arrastrar : Rotar escenas 3D"
echo ""
