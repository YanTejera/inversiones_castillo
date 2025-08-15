# Ruta a tu proyecto y entorno virtual
$proyecto = "C:\Users\yfto9\OneDrive\Documents\inversiones_castillo"
$venv = "$proyecto\venv"

# Tu API Key de Claude (Anthropic)
$env:ANTHROPIC_API_KEY = "AQUI_TU_API_KEY_DE_CLAUDE"

# Ir al directorio del proyecto
Set-Location $proyecto

# Activar el entorno virtual
& "$venv\Scripts\Activate.ps1"

# Ejecutar Python con un chat interactivo con Claude en español
python - <<'PYTHON'
from anthropic import Anthropic

client = Anthropic()

# Instrucción fija para que siempre hable en español
instruccion_espanol = "A partir de ahora, responde SIEMPRE en español, con explicaciones claras."

print("\n=== Conexión establecida con Claude (modo español) ===")
print("Escribe 'salir' para terminar.\n")

# Mensaje inicial para establecer el idioma
client.messages.create(
    model="claude-3-opus-20240229",
    max_tokens=10,
    messages=[{"role": "user", "content": instruccion_espanol}]
)

while True:
    prompt = input("Tú: ")
    if prompt.lower() in ["salir", "exit", "quit"]:
        break

    resp = client.messages.create(
        model="claude-3-opus-20240229",
        max_tokens=500,
        messages=[
            {"role": "user", "content": instruccion_espanol},
            {"role": "user", "content": prompt}
        ]
    )

    print(f"\nClaude: {resp.content[0].text}\n")
PYTHON
