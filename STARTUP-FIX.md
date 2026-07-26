
# Nythera Dashboard Startup Fix

This version:
- binds explicitly to 0.0.0.0
- uses Railway's PORT automatically
- logs the startup address
- adds /api/health
- configures Railway health checks

Railway:
- Root Directory: blank
- Start Command: leave blank or use npm start
- Target Port: use the Railway-generated PORT; if manually set, use 8080
