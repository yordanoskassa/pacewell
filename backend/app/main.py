from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import connect_db, close_db
from .routes import auth, fitbit, heart_rate, activities, symptoms, ai, reports, demo


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="PaceWell API",
    description="Health monitoring with Fitbit integration and AI insights",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(fitbit.router)
app.include_router(heart_rate.router)
app.include_router(activities.router)
app.include_router(symptoms.router)
app.include_router(ai.router)
app.include_router(reports.router)
app.include_router(demo.router)


@app.get("/")
async def root():
    return {"app": "PaceWell", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "ok"}
