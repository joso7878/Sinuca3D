# Sinuca 3D – Cena com Física Simplificada

- Mesa em GLB (fallback para plano verde)
- Taco GLB
- Bolas instanciadas a partir de um modelo de bolas (usa um mesh template)
- Colisão bola-bola e bola-borda (elástica simples) + atrito
- Animação: taco empurra a bola branca, que colide com o triângulo

## Rodar
```bash
cd Introducing_the_World_App_Physics
python -m http.server -b 127.0.0.1 8000
```
Abra http://127.0.0.1:8000
